import { Routes } from '@angular/router';
import { SearchComponent } from './features/pages/ViewUser/search/search.component';
import { LoginComponent } from './features/pages/login/login.component';
import { HomeComponent } from './features/pages/home/home.component';
import { RegisterComponent } from './features/pages/ViewUser/register/register.component';
import { ProfileComponent } from './features/pages/profile/profile.component';
import { AdminUserComponent } from './features/pages/ViewAdmin/ManageUsers/admin-user.component';
import { AdminVideoComponent } from './features/pages/ViewAdmin/ManageVideos/admin-video.component';
import { LevelComponent } from './features/pages/ViewAdmin/Learning/adminLevel/level.component';
import { CourseComponent } from './features/pages/ViewAdmin/Learning/adminCourse/course.component';
import { UnitComponent } from './features/pages/ViewAdmin/Learning/adminUnit/unit.component';
import { UnitDetailComponent} from './features/pages/ViewAdmin/Learning/adminUnitDetail/unit-detail.component';
import { QuizComponent } from './features/pages/ViewAdmin/Learning/quiz/test.component';
import { PlacementComponent } from './features/pages/ViewAdmin/ManageTests/placement.component';
import { AdminTeacherListComponent } from './features/pages/ViewAdmin/AppTeacher/ListTeacher/teacher-list.component';
import { TeacherDetailComponent} from'./features/pages/ViewAdmin/AppTeacher/TeacherDetail/teacher-detail.component';
import { TeacherScheduleComponent} from'./features/pages/ViewAdmin/Schedule/schedule.component';
import { TeacherBookingsComponent} from './features/pages/ViewAdmin/MyClass/myclass.component';

import { MyProgressComponent } from './features/pages/ViewUser/Learning/unit/unit.component';
import { QuizLearnComponent } from './features/pages/ViewUser/Learning/quiz/quiz.component';
import { PlacementUserComponent } from './features/pages/ViewUser/practice/placement.component';
import { TeacherProfileComponent} from './features/pages/ViewUser/BecomeTeacher/becometeacher.component';
import { TeacherSchedulesComponent} from './features/pages/ViewUser/Schedule/ScheduleList/schedule-list.component';
import { ScheduleDetailComponent} from './features/pages/ViewUser/Schedule/ScheduleDetail/schedule-detail.component';
import { MyBookingsComponent } from './features/pages/ViewUser/Booking/MyBookings/my-bookings.component';
import { BookingDetailComponent } from './features/pages/ViewUser/Booking/BookingDetail/booking-detail.component';
import { PaymentComponent } from './features/pages/ViewUser/Payment/payment.component';
import { VideoRoomComponent } from './features/pages/ViewUser/VideoRoom/video-room.component';
import { ReviewComponent } from './features/pages/ViewUser/ReviewClass/review.component';

import { Component } from '@angular/core';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },

  { path: 'admin/users', component: AdminUserComponent },
  { path: 'admin/videos', component: AdminVideoComponent },
  { path: 'admin/levels', component: LevelComponent },
  { path: 'admin/courses', component: CourseComponent },
  { path: 'admin/units', component: UnitComponent },
  { path: 'admin/unitDetail', component: UnitDetailComponent },
  { path: 'admin/tests', component: QuizComponent },
  { path: 'admin/placements', component: PlacementComponent },
  { path: 'admin/teachers', component: AdminTeacherListComponent },
  { path: 'admin/teachers/:id', component: TeacherDetailComponent },
  { path: 'admin/schedule', component: TeacherScheduleComponent },
  { path: 'admin/classrooms', component: TeacherBookingsComponent },

  { path: 'user/units', component: MyProgressComponent },
  { path: 'user/search', component: SearchComponent },
  { path: 'user/register', component: RegisterComponent },
  { path: 'user/quiz', component: QuizLearnComponent },
  { path: 'user/tests', component: PlacementUserComponent },
  { path: 'user/become-teacher', component: TeacherProfileComponent },
  { path: 'user/learnOnline', component: TeacherSchedulesComponent },
  { path: 'schedule/:id', component: ScheduleDetailComponent },
  { path: 'booking/:id', component: BookingDetailComponent },

  { path: 'my-bookings', component: MyBookingsComponent },

  { path: 'payment/:id', component: PaymentComponent },

  { path: 'room/:id', component: VideoRoomComponent },

  { path: 'review/:id', component: ReviewComponent },
];
