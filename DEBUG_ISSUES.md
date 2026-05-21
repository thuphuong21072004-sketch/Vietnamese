# Debug Issues Report

## Issue 1: Admin Menu Not Displaying After Login

### Root Cause
When API returns user data after login, the `role` was being updated but `adminMode` wasn't being set correctly for Admin users.

**Previous Code (Buggy):**
```typescript
this.role = apiRole ? this.normalizeRole(apiRole) : (this.role ?? this.normalizeRole(res.roleId));
this.adminMode = this.role === 'Moderator' ? 'teacher' : this.adminMode;  // ← Only updates if Moderator
```

If role was Admin, `adminMode` kept its old value which could be anything.

### Solution
Updated to always set `adminMode` based on role:
```typescript
if (this.role === 'Moderator') {
  this.adminMode = 'teacher';
} else if (this.role === 'Admin') {
  this.adminMode = 'management';
}
```

### Verification
1. Added debug logging to console: `console.log('Role update:', { oldRole, apiRole, normalizedRole: this.role, adminMode: this.adminMode })`
2. Added debug display in menu: Shows current `role | adminMode | isLogin` values
3. Check browser console (F12 → Console tab) when logging in as Admin
4. Should see: `Role: Admin | AdminMode: management | IsLogin: true`

### Testing Steps
```
1. Login as Admin account
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Look for "Role update:" log message
5. Verify menuShows "Admin tools" button in menu (top-left)
6. Click "Admin tools" to see management menu (Users, Videos, Levels, Tests, Dashboard)
7. Click "Teacher panel" to see teacher menu (Applications, Schedule, Classrooms)
```

---

## Issue 2: HTTP 400 Bad Request on Teacher Schedule Endpoints

### Root Cause
Backend service validates teacher profile status before allowing schedule operations:

**Backend Validation (TeacherAvailabilityServiceImpl.cs):**
```csharp
public async Task Create(TeacherAvailabilityDTO dto)
{
    // ... get current user ...
    
    var teacher = await _teacherProfileRepository.GetByUserId(userId);
    if (teacher == null || teacher.Status != Constant.StatusTeacherProfile.Approved)
    {
        throw new Exception("Teacher not approved");  // ← Throws 400 Bad Request
    }
    
    // ... more validations ...
}
```

**Error Occurs In:**
- GET `/api/teacher-availability/me` - when loading teacher's schedule list
- POST `/api/teacher-availability/create` - when creating new schedule
- PUT `/api/teacher-availability/update/{id}` - when editing schedule

### Why 400 Appears
Teacher profile status is one of: `Draft`, `Pending`, `Approved`, `Rejected`
- Only `Approved` teachers can create/manage schedules
- If user is `Pending` (awaiting admin review) → 400 error
- If user is `Draft` (incomplete profile) → 400 error
- If user is `Rejected` → 400 error

### Solution Options

#### Option A: User Creates Teacher Profile (Self-Service)
1. Login as User account
2. Click "Register to teach" → `/user/become-teacher`
3. Fill teacher profile form:
   - Specialty (subject/topic)
   - Experience
   - Avatar image
   - CV/certification file
4. Submit form
5. Admin reviews and approves in: `/admin/teachers` (Teacher Applications)
6. Once status = `Approved`, user can create schedules

#### Option B: Admin Approves Teacher Profile (Admin Portal)
1. Login as Admin account
2. Click "Admin tools" button (top-left menu)
3. Click "Teacher Applications"
4. Review pending teacher profiles
5. Click "Approve" button for each teacher
6. Status changes to `Approved`

### Additional Validations That Cause 400
Even with Approved status, schedule creation validates:
```csharp
// Must be 15+ minutes in future
if (dto.StartTime <= DateTime.UtcNow.AddMinutes(15))
    throw new Exception("Schedule must be at least 15 minutes later");

// Must be within 7 days
if (dto.StartTime >= DateTime.UtcNow.AddDays(7))
    throw new Exception("Schedule cannot exceed 7 days");

// Duration: 30 mins minimum, 4 hours maximum
if (duration.TotalMinutes < 30)
    throw new Exception("Minimum duration is 30 minutes");
if (duration.TotalHours > 4)
    throw new Exception("Maximum duration is 4 hours");

// Cannot have overlapping schedules
if (overlap)
    throw new Exception("Schedule overlaps");
```

### Testing Steps
```
1. Ensure teacher profile is APPROVED (check status in Admin Portal)
2. Login as Teacher (Moderator role)
3. Navigate to: `/admin/schedule`
4. Create new schedule with times that meet validation rules:
   - Start time: now + 30 mins (2024-01-15 14:30)
   - End time: start + 1 hour (2024-01-15 15:30)
   - Ensure no existing schedule overlaps
5. Click "Create"
6. Should succeed (200 OK response)
```

### Error Response Format
When 400 occurs, middleware catches exception and returns:
```json
{
  "success": false,
  "message": "Teacher not approved"  // or other validation error
}
```

---

## Debugging Checklist

- [ ] **Menu Display**
  - [ ] Open browser Console (F12)
  - [ ] Look for "Role update:" message when logging in
  - [ ] Verify `role: 'Admin'` appears in console
  - [ ] Check menu shows "Admin tools" button

- [ ] **Schedule Creation**
  - [ ] Verify teacher profile exists in database
  - [ ] Check teacher profile status = `Approved` (not Draft/Pending/Rejected)
  - [ ] Open Network tab in F12
  - [ ] Attempt to create schedule
  - [ ] Check 400 response body for specific error message
  - [ ] Adjust schedule times to meet backend validations

- [ ] **Role Normalization**
  - [ ] Check token contains role (numeric: 1, 2, 3 or string: "User", "Admin", "Moderator")
  - [ ] Verify `normalizeRole()` converts correctly
  - [ ] Console log should show normalized role

---

## Quick Fixes Applied

1. **app.component.ts**
   - Fixed adminMode update logic in getCurrentUser() API response handler
   - Added debug logging: `console.log('Role update:', { ... })`
   - Added getter: `debugInfo` property

2. **app.component.html**
   - Added debug display in menu heading (shows role, adminMode, isLogin)

---

## Related Files
- Frontend: `/Fontend/src/app/app.component.ts` - Login and role handling
- Frontend: `/Fontend/src/app/app.component.html` - Menu rendering
- Frontend: `/Fontend/src/app/features/pages/ViewAdmin/Schedule/schedule.component.ts` - Schedule operations
- Backend: `/Backend/Backend/Services/impl/TeacherAvailabilityServiceImpl.cs` - Schedule validation
- Backend: `/Backend/Backend/Controllers/TeacherAvailabilityController.cs` - API endpoints
