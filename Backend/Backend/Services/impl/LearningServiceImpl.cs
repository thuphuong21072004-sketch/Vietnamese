using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.impl
{
    public class LearningServiceImpl : LearningService
    {
        private readonly LevelRepository _levelRepository;
        private readonly CourseRepository _courseRepository;
        private readonly UnitRepository _unitRepository;
        private readonly UserContextUtil _userContext;
        private readonly ProgressRepository _progressRepository;
        private readonly IMapper _mapper;

        public LearningServiceImpl(
            LevelRepository levelRepository,
            CourseRepository courseRepository,
            UnitRepository unitRepository,
            UserContextUtil userContext,
            IMapper mapper,
            ProgressRepository progressRepository)
        {
            _levelRepository = levelRepository;
            _courseRepository = courseRepository;
            _unitRepository = unitRepository;
            _userContext = userContext;
            _mapper = mapper;
            _progressRepository = progressRepository;
        }

        /*
         * Kiểm tra quyền quản lý
         * O(1)
         * thuphuong21072004
         */
        private bool HasManagePermission()
        {
            var role = _userContext.GetRole();

            return role == common.Constant.Role.Admin
                || role == common.Constant.Role.Moderator;
        }

        /*
         * Kiểm tra quyền admin
         * O(1)
         * thuphuong21072004
         */
        private bool IsAdmin()
        {
            return _userContext.GetRole() == common.Constant.Role.Admin;
        }

        /*
         * Lấy danh sách level
         * O(n)
         * thuphuong21072004
         */
        public async Task<List<LevelDTO>> GetLevels()
        {
            var levels = await _levelRepository.GetAllLevels(null);

            return _mapper.Map<List<LevelDTO>>(levels);
        }

        /*
         * Lấy level theo id
         * O(1)
         * thuphuong21072004
         */
        public async Task<LevelDTO?> GetLevelById(int levelId)
        {
            var level = await _levelRepository.GetLevelById(levelId);

            return level == null
                ? null
                : _mapper.Map<LevelDTO>(level);
        }

        /*
         * Lưu danh sách level
         * O(n)
         * thuphuong21072004
         */
        public async Task SaveLevels(List<LevelDTO> list)
        {
            if (!HasManagePermission())
            {
                throw new UnauthorizedAccessException();
            }

            if (list == null || list.Count == 0)
            {
                return;
            }

            var deleteIds = list
                .Where(x => x.IsDelete && x.LevelId > 0)
                .Select(x => x.LevelId)
                .ToList();

            if (deleteIds.Count > 0)
            {
                if (!IsAdmin())
                {
                    throw new UnauthorizedAccessException();
                }

                await _levelRepository.DeleteLevels(deleteIds);
            }

            var newLevels = list
                .Where(x => !x.IsDelete && x.LevelId == 0)
                .ToList();

            if (newLevels.Count > 0)
            {
                var currentMax = await _levelRepository.GetMaxOrderIndex();

                foreach (var dto in newLevels)
                {
                    currentMax++;

                    var entity = _mapper.Map<Level>(dto);

                    entity.IsActive = true;
                    entity.OrderIndex = currentMax;

                    await _levelRepository.AddLevel(entity);
                }
            }

            var updateLevels = list
                .Where(x => !x.IsDelete && x.LevelId > 0)
                .ToList();

            if (updateLevels.Count > 0)
            {
                var ids = updateLevels.Select(x => x.LevelId).ToHashSet();

                var dbLevels = (await _levelRepository.GetAllLevels(null))
                    .Where(x => ids.Contains(x.LevelId))
                    .ToDictionary(x => x.LevelId);

                foreach (var dto in updateLevels)
                {
                    if (!dbLevels.TryGetValue(dto.LevelId, out var entity))
                    {
                        continue;
                    }

                    dto.OrderIndex = entity.OrderIndex;

                    _mapper.Map(dto, entity);

                    await _levelRepository.UpdateLevel(entity);
                }
            }

            await _levelRepository.SaveLevel();
        }

        /*
         * Lấy danh sách course
         * O(n)
         * thuphuong21072004
         */
        public async Task<List<CourseDTO>> GetCourses(int levelId)
        {
            var userId = _userContext.GetUserId();

            var courses = await _courseRepository
    .GetAllCourses(levelId, null);

            var progresses = await _progressRepository
                .GetUserCourses(
                    userId,
                    levelId,
                    common.Constant.RefType.Course);

            var progressDict = progresses
                .ToDictionary(x => x.RefId);

            return courses.Select(course =>
            {
                progressDict.TryGetValue(course.CourseId, out var progress);

                var dto = _mapper.Map<CourseDTO>(course);

                dto.Status = progress?.Status;

                return dto;
            }).ToList();
        }

        /*
         * Lấy course theo id
         * O(1)
         * thuphuong21072004
         */
        public async Task<CourseDTO?> GetCourseById(int courseId)
        {
            var course = await _courseRepository.GetCourseById(courseId);

            return course == null
                ? null
                : _mapper.Map<CourseDTO>(course);
        }

        /*
         * Lưu danh sách course
         * O(n)
         * thuphuong21072004
         */
        public async Task SaveCourses(List<CourseDTO> list)
        {
            if (!HasManagePermission())
            {
                throw new UnauthorizedAccessException();
            }

            if (list == null || list.Count == 0)
            {
                return;
            }

            var currentUser = _userContext.GetName();

            var deleteIds = list
                .Where(x => x.IsDelete && x.CourseId > 0)
                .Select(x => x.CourseId)
                .ToList();

            if (deleteIds.Count > 0)
            {
                if (!IsAdmin())
                {
                    throw new UnauthorizedAccessException();
                }

                await _courseRepository.DeleteCourses(deleteIds);
            }

            var newCourses = list
                .Where(x => !x.IsDelete && x.CourseId == 0)
                .ToList();

            if (newCourses.Count > 0)
            {
                var currentMax = await _courseRepository
                    .GetMaxOrderIndex(newCourses.First().LevelId);

                foreach (var dto in newCourses)
                {
                    currentMax++;

                    var entity = _mapper.Map<Course>(dto);

                    entity.CreatedBy = currentUser;
                    entity.IsActive = true;
                    entity.OrderIndex = currentMax;

                    await _courseRepository.AddCourse(entity);
                }
            }

            var updateCourses = list
                .Where(x => !x.IsDelete && x.CourseId > 0)
                .ToList();

            foreach (var dto in updateCourses)
            {
                var entity = await _courseRepository.GetCourseById(dto.CourseId);

                if (entity == null)
                {
                    continue;
                }

                dto.LevelId = entity.LevelId;
                dto.OrderIndex = entity.OrderIndex;

                _mapper.Map(dto, entity);

                await _courseRepository.UpdateCourse(entity);
            }

            await _courseRepository.SaveCourse();
        }

        /*
         * Lấy danh sách unit
         * O(n)
         * thuphuong21072004
         */
        public async Task<List<UnitDTO>> GetUnits(int courseId)
        {
            var userId = _userContext.GetUserId();

            var units = await _unitRepository
    .GetAllUnits(courseId, null);

            var progresses = await _progressRepository
                .GetUserProgress(
                    userId,
                    courseId,
                    common.Constant.RefType.Unit);

            var progressDict = progresses
                .ToDictionary(x => x.RefId);

            return units.Select(unit =>
            {
                progressDict.TryGetValue(unit.UnitId, out var progress);

                var dto = _mapper.Map<UnitDTO>(unit);

                dto.Status = progress?.Status;

                return dto;
            }).ToList();
        }

        /*
         * Lấy unit theo id
         * O(1)
         * thuphuong21072004
         */
        public async Task<UnitDTO?> GetUnitById(int unitId)
        {
            var unit = await _unitRepository.GetUnitById(unitId);

            return unit == null
                ? null
                : _mapper.Map<UnitDTO>(unit);
        }

        /*
         * Lấy tiến trình học tập
         * O(n)
         * thuphuong21072004m
         */
        
        public async Task<List<LevelDTO>> GetMyProgress()
        {
            var userId = _userContext.GetUserId();

            string refTypeLevel =
                common.Constant.RefType.Level;

            string refTypeCourse =
                common.Constant.RefType.Course;

            string refTypeUnit =
                common.Constant.RefType.Unit;

            await UnlockFirstUnit(userId);

            var currentLevel =
                await _progressRepository.GetCurrentProgress(
                    userId,
                    refTypeLevel);

            var currentCourse =
                await _progressRepository.GetCurrentProgress(
                    userId,
                    refTypeCourse);

            var levels =
                await _levelRepository.GetAllLevels(true)
                ?? new List<Level>();

            var result = new List<LevelDTO>();

            var userLevels =
                await _progressRepository.GetUserLevels(
                    userId,
                    refTypeLevel);

            var userLevelDict = userLevels
                .ToDictionary(x => x.RefId);

            List<Course> currentCourses =
                currentLevel == null
                    ? new List<Course>()
                    : await _courseRepository.GetAllCourses(
                        currentLevel.RefId,
                        true);

            var userCourses =
                currentLevel == null
                    ? new List<UserProgress>()
                    : await _progressRepository.GetUserCourses(
                        userId,
                        currentLevel.RefId,
                        refTypeCourse);

            var userCourseDict = userCourses
                .ToDictionary(x => x.RefId);

            List<Unit> currentUnits =
                currentCourse == null
                    ? new List<Unit>()
                    : await _unitRepository.GetAllUnits(
                        currentCourse.RefId,
                        true);

            var userUnits =
                currentCourse == null
                    ? new List<UserProgress>()
                    : await _progressRepository.GetUserUnits(
                        userId,
                        currentCourse.RefId,
                        refTypeUnit);

            var userUnitDict = userUnits
                .ToDictionary(x => x.RefId);

            foreach (var level in levels
                         .OrderBy(x => x.OrderIndex))
            {
                userLevelDict.TryGetValue(
                    level.LevelId,
                    out var levelProgress);

                var levelDTO = new LevelDTO
                {
                    LevelId = level.LevelId,
                    LevelName = level.LevelName,
                    Description = level.Description,
                    OrderIndex = level.OrderIndex,
                    IsActive = level.IsActive,
                    Status = levelProgress?.Status,
                    Courses = new List<CourseDTO>()
                };

                if (currentLevel != null
                    && level.LevelId == currentLevel.RefId)
                {
                    foreach (var course in currentCourses
                                 .OrderBy(x => x.OrderIndex))
                    {
                        userCourseDict.TryGetValue(
                            course.CourseId,
                            out var courseProgress);

                        var courseDTO = new CourseDTO
                        {
                            CourseId = course.CourseId,
                            LevelId = course.LevelId,
                            CourseName = course.CourseName,
                            Description = course.Description,
                            OrderIndex = course.OrderIndex,
                            IsActive = course.IsActive,
                            Status = courseProgress?.Status,
                            Units = new List<UnitDTO>()
                        };

                        if (currentCourse != null
                            && course.CourseId == currentCourse.RefId)
                        {
                            foreach (var unit in currentUnits
                                         .OrderBy(x => x.OrderIndex))
                            {
                                userUnitDict.TryGetValue(
                                    unit.UnitId,
                                    out var unitProgress);

                                var unitDTO = new UnitDTO
                                {
                                    UnitId = unit.UnitId,
                                    CourseId = unit.CourseId,
                                    UnitName = unit.UnitName,
                                    VideoUrl = unit.VideoUrl,
                                    Duration = unit.Duration,
                                    OrderIndex = unit.OrderIndex,
                                    Status = unitProgress?.Status
                                };

                                courseDTO.Units.Add(unitDTO);
                            }
                        }

                        levelDTO.Courses.Add(courseDTO);
                    }
                }

                result.Add(levelDTO);
            }

            return result;
        }
        /*
 * Lưu unit
 * O(1)
 * thuphuong21072004
 */
        public async Task SaveUnit(UnitDTO dto)
        {
            if (!HasManagePermission())
            {
                throw new UnauthorizedAccessException();
            }

            if (dto == null)
            {
                return;
            }

            var currentUser = _userContext.GetName();

            if (dto.UnitId == 0)
            {
                var entity = _mapper.Map<Unit>(dto);

                entity.IsActive = true;
                entity.CreatedBy = currentUser;
                entity.CreatedDate = DateTime.Now;

                var maxOrder = await _unitRepository
                    .GetMaxOrderIndex(dto.CourseId);

                entity.OrderIndex = maxOrder + 1;

                await _unitRepository.AddUnit(entity);
            }
            else
            {
                var entity = await _unitRepository
                    .GetUnitById(dto.UnitId);

                if (entity == null)
                {
                    return;
                }

                if (!string.IsNullOrEmpty(entity.VideoUrl)
                    && entity.VideoUrl != dto.VideoUrl)
                {
                    var oldFileName = Path.GetFileName(entity.VideoUrl);

                    var oldFilePath = Path.Combine(
                        Directory.GetCurrentDirectory(),
                        "wwwroot",
                        "videos",
                        oldFileName);

                    if (File.Exists(oldFilePath))
                    {
                        File.Delete(oldFilePath);
                    }
                }

                dto.OrderIndex = entity.OrderIndex;
                dto.CourseId = entity.CourseId;

                _mapper.Map(dto, entity);

                await _unitRepository.UpdateUnit(entity);
            }

            await _unitRepository.SaveUnit();
        }

        /*
         * Xóa unit
         * O(n)
         * thuphuong21072004
         */
        public async Task DeleteUnits(List<int> unitIds)
        {
            if (!IsAdmin())
            {
                throw new UnauthorizedAccessException();
            }

            if (unitIds == null || unitIds.Count == 0)
            {
                return;
            }

            var units = await _unitRepository
                .GetUnitsByIds(unitIds);

            foreach (var unit in units)
            {
                if (string.IsNullOrEmpty(unit.VideoUrl))
                {
                    continue;
                }

                var fileName = Path.GetFileName(unit.VideoUrl);

                var filePath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "videos",
                    fileName);

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
            }

            await _unitRepository.DeleteUnits(
                unitIds,
                common.Constant.RefType.Unit);

            await _unitRepository.SaveUnit();
        }

        /*
         * Mở khóa bài học đầu tiên
         * O(1)
         * thuphuong21072004
         */
        private async Task UnlockFirstUnit(int userId)
        {
            var refLevel = common.Constant.RefType.Level;
            var refCourse = common.Constant.RefType.Course;
            var refUnit = common.Constant.RefType.Unit;

            var hasLevel =
    await _progressRepository
        .HasUserProgress(userId, refLevel);

            var hasCourse =
                await _progressRepository
                    .HasUserProgress(userId, refCourse);

            var hasUnit =
                await _progressRepository
                    .HasUserProgress(userId, refUnit);

            if (hasLevel
                && hasCourse
                && hasUnit)
            {
                return;
            }

            var firstLevel = (await _levelRepository
                .GetAllLevels(true))
                .OrderBy(x => x.OrderIndex)
                .FirstOrDefault();

            if (firstLevel == null)
            {
                return;
            }

            var firstCourse = (await _courseRepository
                .GetAllCourses(firstLevel.LevelId, true))
                .OrderBy(x => x.OrderIndex)
                .FirstOrDefault();

            if (firstCourse == null)
            {
                return;
            }

            var firstUnit = (await _unitRepository
                .GetAllUnits(firstCourse.CourseId, true))
                .OrderBy(x => x.OrderIndex)
                .FirstOrDefault();

            if (firstUnit == null)
            {
                return;
            }

            if (!hasLevel)
            {
                await _progressRepository.AddUserLevel(
                    userId,
                    firstLevel.LevelId,
                    refLevel);
            }

            if (!hasCourse)
            {
                await _progressRepository.AddUserCourse(
                    userId,
                    firstCourse.CourseId,
                    refCourse);
            }

            if (!hasUnit)
            {
                await _progressRepository.AddUserProgress(
                    new UserProgress
                    {
                        UserId = userId,
                        RefType = refUnit,
                        RefId = firstUnit.UnitId,
                        AssignedDate = DateTime.Now,
                        Status = false
                    });
            }

            await _progressRepository.Save();
        }

        /*
         * Lấy toàn bộ learning path
         * O(n)
         * thuphuong21072004
         */
        public async Task<List<LevelDTO>> GetAllLearningPath()
        {
            var levels = await _levelRepository
                .GetQueryable()
                .AsNoTracking()
                .Include(x => x.Courses.Where(c => c.IsActive))
                .ThenInclude(x => x.Units.Where(u => u.IsActive))
                .Where(x => x.IsActive)
                .OrderBy(x => x.OrderIndex)
                .ToListAsync();

            return _mapper.Map<List<LevelDTO>>(levels);
        }
    }
}