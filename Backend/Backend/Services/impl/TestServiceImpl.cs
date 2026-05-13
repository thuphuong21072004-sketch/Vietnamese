using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.impl
{
    public class TestServiceImpl : TestService
    {
        private readonly UserContextUtil _userContext;
        private readonly PlacementRepository _placementRepository;
        public readonly QuizRepository _quizRepository;
        private readonly IMapper _mapper;
        private readonly PartRepository _partRepository;
        private readonly PassageRepository _passageRepository;
        private readonly QuestionRepository _questionRepository;
        private readonly AnswerRepository _answerRepository;
        private readonly ProgressRepository _progressRepository;
        private readonly UserAnswerRepository _userAnswerRepository;
        private readonly UserQuizRepository _userQuizRepository;
        private readonly LevelRepository _levelRepository;
        private readonly CourseRepository _courseRepository;
        private readonly UnitRepository _unitRepository;

        public TestServiceImpl(
            UserContextUtil userContext,
            QuizRepository quizRepository,
            IMapper mapper,
            PlacementRepository placementRepository,
            PartRepository partRepository,
            PassageRepository passageRepository,
            QuestionRepository questionRepository,
            AnswerRepository answerRepository,
            UserAnswerRepository userAnswerRepository,
            UserQuizRepository userQuizRepository,
            ProgressRepository progressRepository,
            LevelRepository levelRepository,
            CourseRepository courseRepository,
            UnitRepository unitRepository)
        {
            _userContext = userContext;
            _quizRepository = quizRepository;
            _mapper = mapper;
            _placementRepository = placementRepository;
            _partRepository = partRepository;
            _passageRepository = passageRepository;
            _questionRepository = questionRepository;
            _answerRepository = answerRepository;
            _userAnswerRepository = userAnswerRepository;
            _userQuizRepository = userQuizRepository;
            _progressRepository = progressRepository;
            _levelRepository = levelRepository;
            _courseRepository = courseRepository;
            _unitRepository = unitRepository;
        }

        /* kiểm tra admin
         * O(1)
         * thuphuong21072004
         */
        private bool ValidateAdmin()
        {
            string role = _userContext.GetRole();
            return role == common.Constant.Role.Admin;
        }

        /* kiểm tra moderator
         * O(1)
         * thuphuong21072004
         */
        private bool ValidateModerator()
        {
            string role = _userContext.GetRole();
            return role == common.Constant.Role.Moderator;
        }

        /* nhảy level
         * O(n)
         * thuphuong21072004
         */
        public async Task UnlockNextLevel(int UnitId)
        {
            int userId = _userContext.GetUserId();
            string refTypeLevel = common.Constant.RefType.Level;
            string refTypeCourse = common.Constant.RefType.Course;
            string refTypeUnit =
    common.Constant.RefType.Unit;
            var Unit = await _unitRepository.GetUnitById(UnitId);
            var course = await _courseRepository.GetCourseById(Unit.CourseId);
            var level = await _levelRepository.GetLevelById(course.LevelId);

            var courses = await _courseRepository.GetAllCourses(level.LevelId, true);
            var userCourses = await _progressRepository.GetUserCourses(userId, level.LevelId, refTypeCourse);
            var completedCourseIds = userCourses
    .Where(x => x.Status == true)
    .Select(x => x.RefId)
    .ToHashSet();

            bool allCompleted =
    courses.All(c =>
        completedCourseIds.Contains(
            c.CourseId));
            if (!allCompleted) return;

            var userLevel = await _progressRepository.GetUserLevel(userId, level.LevelId, refTypeLevel);
            userLevel.Status = true;
            userLevel.CompletedDate = DateTime.Now;

            var nextLevel = (await _levelRepository.GetAllLevels(true)).FirstOrDefault(x => x.OrderIndex == level.OrderIndex + 1);
            if (nextLevel != null)
            {
                var existedLevel =
                    await _progressRepository
                        .GetUserLevel(
                            userId,
                            nextLevel.LevelId,
                            common.Constant.RefType.Level
                        );

                if (existedLevel == null)
                {
                    await _progressRepository.AddUserProgress(
                        new UserProgress
                        {
                            UserId = userId,
                            RefType =
                                common.Constant.RefType.Level,
                            RefId = nextLevel.LevelId,
                            AssignedDate = DateTime.Now,
                            Status = false
                        }
                    );
                }

                var firstCourse =
                    (await _courseRepository.GetAllCourses(
                        nextLevel.LevelId,
                        true
                    ))
                    .OrderBy(x => x.OrderIndex)
                    .FirstOrDefault();

                if (firstCourse != null)
                {
                    var existedCourse =
                        await _progressRepository
                            .GetUserCourseByCourseId(
                                userId,
                                firstCourse.CourseId,
                                common.Constant.RefType.Course
                            );

                    if (existedCourse == null)
                    {
                        await _progressRepository.AddUserProgress(
                            new UserProgress
                            {
                                UserId = userId,
                                RefType =
                                    common.Constant.RefType.Course,
                                RefId = firstCourse.CourseId,
                                AssignedDate = DateTime.Now,
                                Status = false
                            }
                        );
                    }

                    var firstUnit =
                        (await _unitRepository.GetAllUnits(
                            firstCourse.CourseId,
                            true
                        ))
                        .OrderBy(x => x.OrderIndex)
                        .FirstOrDefault();

                    if (firstUnit != null)
                    {
                        var existedUnit =
                            await _progressRepository
                                .GetUserUnitByUnitId(
                                    userId,
                                    firstUnit.UnitId,
                                    common.Constant.RefType.Unit
                                );

                        if (existedUnit == null)
                        {
                            await _progressRepository.AddUserProgress(
                                new UserProgress
                                {
                                    UserId = userId,
                                    RefType =
                                        common.Constant.RefType.Unit,
                                    RefId = firstUnit.UnitId,
                                    AssignedDate = DateTime.Now,
                                    Status = false
                                }
                            );
                        }
                    }
                }
            }
            await _progressRepository.Save();
        }

        /* nhảy course
         * O(n)
         * thuphuong21072004
         */
        public async Task UnlockNextCourse(int UnitId)
        {
            string refTypeCourse = common.Constant.RefType.Course;
            int userId = _userContext.GetUserId();
            string refTypeUnit =
    common.Constant.RefType.Unit;

            var Unit = await _unitRepository.GetUnitById(UnitId);
            var course = await _courseRepository.GetCourseById(Unit.CourseId);

            var Units = await _unitRepository.GetAllUnits(course.CourseId, true);
            var progress = await _progressRepository
    .GetUserUnits(
        userId,
        course.CourseId,
        refTypeUnit
    );
            var completedUnitIds = progress
    .Where(x => x.Status == true)
    .Select(x => x.RefId)
    .ToHashSet();
            bool allCompleted =
    Units.All(l =>
        completedUnitIds.Contains(
            l.UnitId));
            if (!allCompleted) return;

            var userCourse = await _progressRepository.GetUserCourseByCourseId(userId, course.CourseId, refTypeCourse);
            userCourse.Status = true;
            userCourse.CompletedDate = DateTime.Now;

            var nextCourse = (await _courseRepository.GetAllCourses(course.LevelId, true)).OrderBy(c => c.OrderIndex).FirstOrDefault(c => c.OrderIndex > course.OrderIndex);
            if (nextCourse != null)
            {
                var existedCourse =
                    await _progressRepository
                        .GetUserCourseByCourseId(
                            userId,
                            nextCourse.CourseId,
                            common.Constant.RefType.Course
                        );

                if (existedCourse == null)
                {
                    await _progressRepository.AddUserProgress(
                        new UserProgress
                        {
                            UserId = userId,
                            RefType =
                                common.Constant.RefType.Course,
                            RefId = nextCourse.CourseId,
                            AssignedDate = DateTime.Now,
                            Status = false
                        }
                    );
                }

                var firstUnit =
                    (await _unitRepository.GetAllUnits(
                        nextCourse.CourseId,
                        true
                    ))
                    .OrderBy(x => x.OrderIndex)
                    .FirstOrDefault();

                if (firstUnit != null)
                {
                    var existedUnit =
                        await _progressRepository
                            .GetUserUnitByUnitId(
                                userId,
                                firstUnit.UnitId,
                                common.Constant.RefType.Unit
                            );

                    if (existedUnit == null)
                    {
                        await _progressRepository.AddUserProgress(
                            new UserProgress
                            {
                                UserId = userId,
                                RefType =
                                    common.Constant.RefType.Unit,
                                RefId = firstUnit.UnitId,
                                AssignedDate = DateTime.Now,
                                Status = false
                            }
                        );
                    }
                }
            }
            else
            {
                await UnlockNextLevel(UnitId);
            }
            await _progressRepository.Save();
        }

        /* nhảy unit
         * O(n)
         * thuphuong21072004
         */
        public async Task UnlockNextUnit(int UnitId)
        {
            int userId = _userContext.GetUserId();
            string refTypeUnit = common.Constant.RefType.Unit;

            var Unit = await _unitRepository.GetUnitById(UnitId);
            var progress = await _progressRepository.GetUserUnitByUnitId(userId, UnitId, refTypeUnit);
            progress.Status = true;
            progress.CompletedDate = DateTime.Now;

            var Units = await _unitRepository.GetAllUnits(Unit.CourseId, true);
            var nextUnit = Units.FirstOrDefault(x => x.OrderIndex == Unit.OrderIndex + 1);

            if (nextUnit != null)
            {
                var exist = await _progressRepository.GetUserUnitByUnitId(userId, nextUnit.UnitId, refTypeUnit);
                if (exist == null)
                {
                    await _progressRepository.AddUserProgress(new UserProgress { UserId = userId, RefType = common.Constant.RefType.Unit, RefId = nextUnit.UnitId, AssignedDate = DateTime.Now, Status = false });
                }
            }
            else
            {
                await UnlockNextCourse(UnitId);
            }
            await _progressRepository.Save();
        }

        /* lấy bài kiểm tra
         * O(p+q+p*a)
         * thuphuong21072004
         */
        public async Task<QuizDTO?> GetQuiz(int refId, string refType)
        {
            var quiz = await _quizRepository.GetQuiz(refId, refType);
            if (quiz == null) return null;

            var quizDto = _mapper.Map<QuizDTO>(quiz);
            var parts = await _partRepository.GetPartsByQuiz(quiz.QuizId);
            quizDto.Parts = new List<PartDTO>();

            foreach (var part in parts)
            {
                var partDto = _mapper.Map<PartDTO>(part);
                var questions = await _questionRepository.GetQuestionsByPart(part.PartId);
                partDto.Questions = _mapper.Map<List<QuestionDTO>>(questions);

                var passages = await _passageRepository.GetPassagesByPart(part.PartId);
                partDto.Passages = new List<PassageDTO>();

                foreach (var passage in passages)
                {
                    var passageDto = _mapper.Map<PassageDTO>(passage);
                    var pQuestions = await _questionRepository.GetQuestionsByPassage(passage.PassageId);
                    passageDto.Questions = _mapper.Map<List<QuestionDTO>>(pQuestions);
                    partDto.Passages.Add(passageDto);
                }
                quizDto.Parts.Add(partDto);
            }
            return quizDto;
        }

        /* lưu bài kiểm tra
         * O(n)
         * thuphuong21072004
         */
        public async Task SaveQuiz(QuizDTO dto)
        {
            if (!ValidateAdmin() && !ValidateModerator())
            {
                throw new UnauthorizedAccessException("You do not have course management privileges.");
            }
            var existedQuiz = await _quizRepository.GetQuiz(dto.RefId, dto.RefType);
            Quiz quiz;

            if (existedQuiz != null)
            {
                quiz = existedQuiz;
                if (!ValidateAdmin() && quiz.IsActive)
                {
                    throw new UnauthorizedAccessException(
                        "Moderator cannot edit active quiz."
                    );
                }

                quiz.QuizName = dto.QuizName;
                quiz.TimeLimit = dto.TimeLimit;
                quiz.PassScore = dto.PassScore;
                quiz.IsActive = dto.IsActive;
            }
            else
            {
                quiz = new Quiz {
                    RefId = dto.RefId, RefType = dto.RefType, QuizName = dto.QuizName, TimeLimit = dto.TimeLimit, PassScore = dto.PassScore, CreatedDate = DateTime.Now,
                    IsActive = ValidateAdmin()
                };
                await _quizRepository.AddQuiz(quiz);
            }

            await _quizRepository.Save();

            foreach (var qDto in dto.Questions) await SaveQuestion(qDto, quiz.QuizId, null, null);
            foreach (var partDto in dto.Parts) await SavePart(partDto, quiz.QuizId);
        }

        /* lưu phần
         * O(n)
         * thuphuong21072004
         */
        private async Task SavePart(PartDTO dto, int quizId)
        {
            var deleteQuestionIds = dto.Questions.Where(x => x.IsDelete).Select(x => x.QuestionId).ToList();
            if (deleteQuestionIds.Any()) await _questionRepository.DeleteQuestions(deleteQuestionIds);

            var deletePassageIds = dto.Passages.Where(x => x.IsDelete).Select(x => x.PassageId).ToList();
            if (deletePassageIds.Any()) await _passageRepository.DeletePassages(deletePassageIds);

            if (dto.IsDelete)
            {
                await _partRepository.DeleteParts(new List<int> { dto.PartId });
                await _partRepository.Save();
                return;
            }

            Part part;
            if (dto.PartId == 0)
            {
                part = new Part { QuizId = quizId };
                await _partRepository.AddPart(part);
            }
            else
            {
                part = await _partRepository.GetPartById(dto.PartId);
                if (part == null) throw new Exception($"Part {dto.PartId} không tồn tại");
            }

            part.PartNumber = dto.PartNumber;
            part.PartName = dto.PartName;
            part.Instruction = dto.Instruction;
            await _partRepository.Save();

            foreach (var qDto in dto.Questions.Where(x => !x.IsDelete)) await SaveQuestion(qDto, quizId, part.PartId, null);
            foreach (var pDto in dto.Passages.Where(x => !x.IsDelete)) await SavePassage(pDto, quizId, part.PartId);
        }

        /* lưu đoạn
         * O(n)
         * thuphuong21072004
         */
        private async Task SavePassage(PassageDTO dto, int quizId, int partId)
        {
            var deleteQuestionIds = dto.Questions.Where(x => x.IsDelete).Select(x => x.QuestionId).ToList();
            if (deleteQuestionIds.Any()) await _questionRepository.DeleteQuestions(deleteQuestionIds);

            if (dto.IsDelete)
            {
                await _passageRepository.DeletePassages(new List<int> { dto.PassageId });
                await _passageRepository.Save();
                return;
            }

            Passage passage;
            if (dto.PassageId == 0)
            {
                passage = new Passage { PartId = partId };
                await _passageRepository.AddPassage(passage);
            }
            else
            {
                passage = await _passageRepository.GetPassageById(dto.PassageId);
                if (passage == null) throw new Exception($"Passage {dto.PassageId} không tồn tại");
            }

            passage.Content = dto.Content;
            passage.ImageUrl = dto.ImageUrl;
            passage.AudioUrl = dto.AudioUrl;
            passage.OrderIndex = dto.OrderIndex;
            await _passageRepository.Save();

            foreach (var qDto in dto.Questions.Where(x => !x.IsDelete)) await SaveQuestion(qDto, quizId, partId, passage.PassageId);
        }

        /* lưu câu hỏi
         * O(n)
         * thuphuong21072004
         */
        private async Task SaveQuestion(QuestionDTO dto, int quizId, int? partId, int? passageId)
        {
            var deleteAnswerIds = dto.Answers.Where(x => x.IsDelete).Select(x => x.AnswerId).ToList();
            if (deleteAnswerIds.Any()) await _answerRepository.DeleteAnswers(deleteAnswerIds);

            if (dto.IsDelete)
            {
                await _questionRepository.DeleteQuestions(new List<int> { dto.QuestionId });
                await _questionRepository.Save();
                return;
            }

            Question question;
            if (dto.QuestionId == 0)
            {
                question = new Question { QuizId = quizId };
                await _questionRepository.AddQuestion(question);
            }
            else
            {
                question = await _questionRepository.GetQuestionById(dto.QuestionId);
                if (question == null) throw new Exception($"Question {dto.QuestionId} không tồn tại");
            }

            question.PartId = partId;
            question.PassageId = passageId;
            question.QuestionText = dto.QuestionText;
            question.ImageUrl = dto.ImageUrl;
            question.AudioUrl = dto.AudioUrl;
            question.OrderIndex = dto.OrderIndex ?? 0;
            question.Score = dto.Score;
            await _questionRepository.Save();

            foreach (var aDto in dto.Answers.Where(x => !x.IsDelete)) await SaveAnswer(aDto, question.QuestionId);
        }

        /* lưu đáp án
         * O(1)
         * thuphuong21072004
         */
        private async Task SaveAnswer(AnswerDTO dto, int questionId)
        {
            Answer answer;
            if (dto.AnswerId == 0)
            {
                answer = new Answer { QuestionId = questionId };
                await _answerRepository.AddAnswer(answer);
            }
            else
            {
                answer = await _answerRepository.GetAnswerById(dto.AnswerId);
                if (answer == null) throw new Exception($"Answer {dto.AnswerId} không tồn tại");
            }

            answer.AnswerText = dto.AnswerText;
            answer.IsCorrect = dto.IsCorrect;
            answer.ImageUrl = dto.ImageUrl;
            answer.AudioUrl = dto.AudioUrl;
            answer.OrderIndex = dto.OrderIndex ?? 0;
            await _answerRepository.Save();
        }

        /* xóa bài kiểm tra 
         * O(1)
         * thuphuong21072004
         */
        public async Task DeleteQuiz(int quizId)
        {
            if (!ValidateAdmin())
            {
                throw new UnauthorizedAccessException("You do not have course management privileges.");
            }
            var quiz = await _quizRepository.GetQuizById(quizId);
            if (quiz == null) throw new Exception("Quiz not found");
            await _quizRepository.DeleteQuiz(quiz);
            await _quizRepository.Save();
        }

        /* kiểm tra ,chấm diểm...
         * O(q + a + l + c + u)
         * thuphuong21072004
         */
        public async Task SubmitQuiz(int quizId, List<int> answerIds)
        {
            int userId = _userContext.GetUserId();

            var quiz = await _quizRepository.GetQuizById(quizId);

            var questions = await _questionRepository.GetQuestionsByQuiz(quizId);

            decimal totalScore = questions.Sum(x => x.Score);

            decimal earnedScore = 0;
            var answerSet =
    answerIds.ToHashSet();
            foreach (var question in questions)
            {
                var correctAnswer = question.Answers?.FirstOrDefault(x => x.IsCorrect);

                if (correctAnswer == null)
                {
                    continue;
                }

                if (answerSet.Contains(correctAnswer.AnswerId))
                {
                    earnedScore += question.Score;
                }
            }

            decimal finalScore =
                totalScore == 0
                    ? 0
                    : Math.Round(earnedScore / totalScore * 100, 2);

            bool isPassed =
                quiz.PassScore != null &&
                finalScore >= quiz.PassScore;

            var userQuiz =
                await _userQuizRepository.GetUserQuiz(userId, quizId);

            if (userQuiz != null)
            {
                userQuiz.Score = finalScore;

                userQuiz.CompletedDate = DateTime.Now;

                userQuiz.IsPassed = isPassed;

                await _userAnswerRepository.DeleteByUserQuizId(
                    userQuiz.UserQuizId
                );
            }
            else
            {
                userQuiz = new UserQuiz
                {
                    UserId = userId,
                    QuizId = quizId,
                    Score = finalScore,
                    CompletedDate = DateTime.Now,
                    IsPassed = isPassed
                };

                await _userQuizRepository.SaveUserQuiz(userQuiz);
            }

            await _userQuizRepository.Save();

            var answers =
    await _answerRepository
        .GetAnswersByIds(answerIds);

            var answerDict = answers
                .ToDictionary(x => x.AnswerId);

            foreach (var answerId in answerIds)
            {
                if (!answerDict.TryGetValue(
                    answerId,
                    out var answer))
                {
                    continue;
                }

                await _userAnswerRepository.SaveUserAnswer(
                    new UserAnswer
                    {
                        UserQuizId = userQuiz.UserQuizId,
                        QuestionId = answer.QuestionId,
                        AnswerId = answerId
                    }
                );
            }

            await _userAnswerRepository.Save();

            if (!isPassed)
            {
                return;
            }

            if (quiz.RefType == common.Constant.RefType.Placement)
            {
                Level? assignedLevel = null;

                if (finalScore >= 90)
                {
                    assignedLevel =
                        await _levelRepository.GetByName(
                            common.Constant.Level.LevelC2
                        );
                }
                else if (finalScore >= 80)
                {
                    assignedLevel =
                        await _levelRepository.GetByName(
                            common.Constant.Level.LevelC1
                        );
                }
                else if (finalScore >= 65)
                {
                    assignedLevel =
                        await _levelRepository.GetByName(
                            common.Constant.Level.LevelB2
                        );
                }
                else if (finalScore >= 50)
                {
                    assignedLevel =
                        await _levelRepository.GetByName(
                            common.Constant.Level.LevelB1
                        );
                }
                else if (finalScore >= 30)
                {
                    assignedLevel =
                        await _levelRepository.GetByName(
                            common.Constant.Level.LevelA2
                        );
                }
                else
                {
                    assignedLevel =
                        await _levelRepository.GetByName(
                            common.Constant.Level.LevelA1
                        );
                }

                if (assignedLevel == null)
                {
                    return;
                }

                var currentLevels =
                    (await _levelRepository.GetAllLevels(true))
                    .OrderBy(x => x.OrderIndex)
                    .ToList();

                var userLevels =
    await _progressRepository
        .GetUserLevels(
            userId,
            common.Constant.RefType.Level
        );

                var userLevelIds = userLevels
    .Where(x => x.Status == true)
    .Select(x => x.RefId)
    .ToHashSet();

                int currentMaxOrder = currentLevels
                    .Where(x =>
                        userLevelIds.Contains(
                            x.LevelId))
                    .Select(x => x.OrderIndex)
                    .DefaultIfEmpty(-1)
                    .Max();

                if (
                    assignedLevel.OrderIndex <=
                    currentMaxOrder
                )
                {
                    return;
                }
                var allLevels =
                    (await _levelRepository.GetAllLevels(true))
                    .OrderBy(x => x.OrderIndex)
                    .ToList();

                foreach (var lv in allLevels)
                {
                    if (lv.OrderIndex >= assignedLevel.OrderIndex)
                    {
                        break;
                    }

                    var levelProgress =
                        await _progressRepository.GetUserLevel(
                            userId,
                            lv.LevelId,
                            common.Constant.RefType.Level
                        );

                    if (levelProgress == null)
                    {
                        await _progressRepository.AddUserProgress(
                            new UserProgress
                            {
                                UserId = userId,
                                RefType =
                                    common.Constant.RefType.Level,
                                RefId = lv.LevelId,
                                AssignedDate = DateTime.Now,
                                CompletedDate = DateTime.Now,
                                Status = true
                            }
                        );
                    }
                    else
                    {
                        levelProgress.Status = true;

                        levelProgress.CompletedDate =
                            DateTime.Now;

                        
                    }
                }

                var currentLevelProgress =
                    await _progressRepository.GetUserLevel(
                        userId,
                        assignedLevel.LevelId,
                        common.Constant.RefType.Level
                    );

                if (currentLevelProgress == null)
                {
                    await _progressRepository.AddUserProgress(
                        new UserProgress
                        {
                            UserId = userId,
                            RefType =
                                common.Constant.RefType.Level,
                            RefId = assignedLevel.LevelId,
                            AssignedDate = DateTime.Now,
                            Status = false
                        }
                    );
                }

                else
                {
                    currentLevelProgress.Status = false;

                    currentLevelProgress.CompletedDate =
                        null;
                }

                var firstCourse =
                    (await _courseRepository.GetAllCourses(
                        assignedLevel.LevelId,
                        true
                    ))
                    .OrderBy(x => x.OrderIndex)
                    .FirstOrDefault();

                if (firstCourse != null)
                {
                    var courseProgress =
                        await _progressRepository
                            .GetUserCourseByCourseId(
                                userId,
                                firstCourse.CourseId,
                                common.Constant.RefType.Course
                            );

                    if (courseProgress == null)
                    {
                        await _progressRepository
                            .AddUserProgress(
                                new UserProgress
                                {
                                    UserId = userId,
                                    RefType =
                                        common.Constant.RefType.Course,
                                    RefId = firstCourse.CourseId,
                                    AssignedDate = DateTime.Now,
                                    Status = false
                                }
                            );
                    }

                    var firstUnit =
                        (await _unitRepository.GetAllUnits(
                            firstCourse.CourseId,
                            true
                        ))
                        .OrderBy(x => x.OrderIndex)
                        .FirstOrDefault();

                    if (firstUnit != null)
                    {
                        var unitProgress =
                            await _progressRepository
                                .GetUserUnitByUnitId(
                                    userId,
                                    firstUnit.UnitId,
                                    common.Constant.RefType.Unit
                                );

                        if (unitProgress == null)
                        {
                            await _progressRepository
                                .AddUserProgress(
                                    new UserProgress
                                    {
                                        UserId = userId,
                                        RefType =
                                            common.Constant.RefType.Unit,
                                        RefId = firstUnit.UnitId,
                                        AssignedDate = DateTime.Now,
                                        Status = false
                                    }
                                );
                        }
                    }
                }

                await _progressRepository.Save();

                return;
            }
            if (quiz.RefType == common.Constant.RefType.Unit)
            {
                var unit =
                    await _unitRepository.GetUnitById(
                        quiz.RefId
                    );

                if (unit == null)
                {
                    return;
                }

                var currentUnitProgress =
                    await _progressRepository
                        .GetUserUnitByUnitId(
                            userId,
                            unit.UnitId,
                            common.Constant.RefType.Unit
                        );
                
                if (currentUnitProgress == null)
                {
                    await _progressRepository.AddUserProgress(
                        new UserProgress
                        {
                            UserId = userId,
                            RefType = common.Constant.RefType.Unit,
                            RefId = unit.UnitId,
                            AssignedDate = DateTime.Now,
                            CompletedDate = DateTime.Now,
                            Status = true
                        }
                    );
                }
                else
                {
                    currentUnitProgress.Status = true;

                    currentUnitProgress.CompletedDate =
                        DateTime.Now;

                    await _progressRepository.UpdateUserProgress(
                        currentUnitProgress
                    );
                }

                var nextUnit =
                    (await _unitRepository.GetAllUnits(
                        unit.CourseId,
                        true
                    ))
                    .OrderBy(x => x.OrderIndex)
                    .FirstOrDefault(x =>
                        x.OrderIndex > unit.OrderIndex);

                if (nextUnit != null)
                {
                    var nextUnitProgress =
                        await _progressRepository
                            .GetUserUnitByUnitId(
                                userId,
                                nextUnit.UnitId,
                                common.Constant.RefType.Unit
                            );

                    if (nextUnitProgress == null)
                    {
                        await _progressRepository
                            .AddUserProgress(
                                new UserProgress
                                {
                                    UserId = userId,
                                    RefType =
                                        common.Constant.RefType.Unit,
                                    RefId = nextUnit.UnitId,
                                    AssignedDate = DateTime.Now,
                                    Status = false
                                }
                            );
                    }

                    await _progressRepository.Save();

                    return;
                }

                var currentCourse =
                    await _courseRepository.GetCourseById(
                        unit.CourseId
                    );

                if (currentCourse == null)
                {
                    return;
                }

                var currentCourseProgress =
                    await _progressRepository
                        .GetUserCourseByCourseId(
                            userId,
                            currentCourse.CourseId,
                            common.Constant.RefType.Course
                        );

                if (currentCourseProgress != null)
                {
                    currentCourseProgress.Status = true;

                    currentCourseProgress.CompletedDate =
                        DateTime.Now;

                    await _progressRepository.UpdateUserProgress(
                        currentCourseProgress
                    );
                }

                var nextCourse =
                    (await _courseRepository.GetAllCourses(
                        currentCourse.LevelId,
                        true
                    ))
                    .OrderBy(x => x.OrderIndex)
                    .FirstOrDefault(x =>
                        x.OrderIndex > currentCourse.OrderIndex);

                if (nextCourse != null)
                {
                    var nextCourseProgress =
                        await _progressRepository
                            .GetUserCourseByCourseId(
                                userId,
                                nextCourse.CourseId,
                                common.Constant.RefType.Course
                            );

                    if (nextCourseProgress == null)
                    {
                        await _progressRepository
                            .AddUserProgress(
                                new UserProgress
                                {
                                    UserId = userId,
                                    RefType =
                                        common.Constant.RefType.Course,
                                    RefId = nextCourse.CourseId,
                                    AssignedDate = DateTime.Now,
                                    Status = false
                                }
                            );
                    }

                    var firstUnit =
                        (await _unitRepository.GetAllUnits(
                            nextCourse.CourseId,
                            true
                        ))
                        .OrderBy(x => x.OrderIndex)
                        .FirstOrDefault();

                    if (firstUnit != null)
                    {
                        var firstUnitProgress =
                            await _progressRepository
                                .GetUserUnitByUnitId(
                                    userId,
                                    firstUnit.UnitId,
                                    common.Constant.RefType.Unit
                                );

                        if (firstUnitProgress == null)
                        {
                            await _progressRepository
                                .AddUserProgress(
                                    new UserProgress
                                    {
                                        UserId = userId,
                                        RefType =
                                            common.Constant.RefType.Unit,
                                        RefId = firstUnit.UnitId,
                                        AssignedDate = DateTime.Now,
                                        Status = false
                                    }
                                );
                        }
                    }
                }

                await _progressRepository.Save();

                return;
            }
            if (quiz.RefType == common.Constant.RefType.Course)
            {
                var course =
                    await _courseRepository.GetCourseById(
                        quiz.RefId
                    );

                if (course == null)
                {
                    return;
                }

                var currentCourseProgress =
                    await _progressRepository.GetUserCourseByCourseId(
                        userId,
                        course.CourseId,
                        common.Constant.RefType.Course
                    );

                if (currentCourseProgress == null)
                {
                    await _progressRepository.AddUserProgress(
                        new UserProgress
                        {
                            UserId = userId,
                            RefType =
                                common.Constant.RefType.Course,
                            RefId = course.CourseId,
                            AssignedDate = DateTime.Now,
                            CompletedDate = DateTime.Now,
                            Status = true
                        }
                    );
                }
                else
                {
                    currentCourseProgress.Status = true;

                    currentCourseProgress.CompletedDate =
                        DateTime.Now;

                    await _progressRepository.UpdateUserProgress(
                        currentCourseProgress
                    );
                }

                var units =
                    await _unitRepository.GetAllUnits(
                        course.CourseId,
                        true
                    );

                foreach (var unit in units)
                {
                    var unitProgress =
                        await _progressRepository.GetUserUnitByUnitId(
                            userId,
                            unit.UnitId,
                            common.Constant.RefType.Unit
                        );

                    if (unitProgress != null)
                    {
                        unitProgress.Status = true;

                        unitProgress.CompletedDate =
                            DateTime.Now;

                        await _progressRepository.UpdateUserProgress(
                            unitProgress
                        );
                    }
                }

                var nextCourse =
                    (await _courseRepository.GetAllCourses(
                        course.LevelId,
                        true
                    ))
                    .OrderBy(x => x.OrderIndex)
                    .FirstOrDefault(x => x.OrderIndex > course.OrderIndex);

                if (nextCourse != null)
                {
                    var existedCourse =
                        await _progressRepository
                            .GetUserCourseByCourseId(
                                userId,
                                nextCourse.CourseId,
                                common.Constant.RefType.Course
                            );

                    if (existedCourse == null)
                    {
                        await _progressRepository.AddUserProgress(
                            new UserProgress
                            {
                                UserId = userId,
                                RefType =
                                    common.Constant.RefType.Course,
                                RefId = nextCourse.CourseId,
                                AssignedDate = DateTime.Now,
                                Status = false
                            }
                        );
                    }

                    var firstUnit =
                        (await _unitRepository.GetAllUnits(
                            nextCourse.CourseId,
                            true
                        ))
                        .OrderBy(x => x.OrderIndex)
                        .FirstOrDefault();

                    if (firstUnit != null)
                    {
                        var existedUnit =
                            await _progressRepository
                                .GetUserUnitByUnitId(
                                    userId,
                                    firstUnit.UnitId,
                                    common.Constant.RefType.Unit
                                );

                        if (existedUnit == null)
                        {
                            await _progressRepository.AddUserProgress(
                                new UserProgress
                                {
                                    UserId = userId,
                                    RefType =
                                        common.Constant.RefType.Unit,
                                    RefId = firstUnit.UnitId,
                                    AssignedDate = DateTime.Now,
                                    Status = false
                                }
                            );
                        }
                    }
                }
                await _progressRepository.Save();

                return;
            }


            if (quiz.RefType == common.Constant.RefType.Level)
            {
                var level =
                    await _levelRepository.GetLevelById(
                        quiz.RefId
                    );

                if (level == null)
                {
                    return;
                }

                var currentLevelProgress =
                    await _progressRepository.GetUserLevel(
                        userId,
                        level.LevelId,
                        common.Constant.RefType.Level
                    );

                if (currentLevelProgress != null)
                {
                    currentLevelProgress.Status = true;

                    currentLevelProgress.CompletedDate = DateTime.Now;
                    await _progressRepository.UpdateUserProgress(currentLevelProgress );

                }

                var courses =
                    await _courseRepository.GetAllCourses(
                        level.LevelId,
                        true
                    );

                foreach (var course in courses)
                {
                    var courseProgress =
                        await _progressRepository.GetUserCourseByCourseId(
                            userId,
                            course.CourseId,
                            common.Constant.RefType.Course
                        );

                    if (courseProgress != null)
                    {
                        courseProgress.Status = true;

                        courseProgress.CompletedDate =
                            DateTime.Now;

                        await _progressRepository
                            .UpdateUserProgress(
                                courseProgress
                            );
                    }

                    var units =
                        await _unitRepository.GetAllUnits(
                            course.CourseId,
                            true
                        );

                    foreach (var unit in units)
                    {
                        var unitProgress =
                            await _progressRepository.GetUserUnitByUnitId(
                                userId,
                                unit.UnitId,
                                common.Constant.RefType.Unit
                            );
                        if (unitProgress != null)
                        {
                            unitProgress.Status = true;

                            unitProgress.CompletedDate =
                                DateTime.Now;

                            await _progressRepository
                                .UpdateUserProgress(
                                    unitProgress
                                );
                        }
                    }
                }

                var nextLevel =
                    (await _levelRepository.GetAllLevels(true))
                    .OrderBy(x => x.OrderIndex)
                    .FirstOrDefault(x => x.OrderIndex > level.OrderIndex);

                if (nextLevel != null)
                {
                    var existedLevel =
                        await _progressRepository
                            .GetUserLevel(
                                userId,
                                nextLevel.LevelId,
                                common.Constant.RefType.Level
                            );

                    if (existedLevel == null)
                    {
                        await _progressRepository.AddUserProgress(
                            new UserProgress
                            {
                                UserId = userId,
                                RefType =
                                    common.Constant.RefType.Level,
                                RefId = nextLevel.LevelId,
                                AssignedDate = DateTime.Now,
                                Status = false
                            }
                        );
                    }

                    var firstCourse =
                        (await _courseRepository.GetAllCourses(
                            nextLevel.LevelId,
                            true
                        ))
                        .OrderBy(x => x.OrderIndex)
                        .FirstOrDefault();

                    if (firstCourse != null)
                    {
                        var existedCourse =
                            await _progressRepository
                                .GetUserCourseByCourseId(
                                    userId,
                                    firstCourse.CourseId,
                                    common.Constant.RefType.Course
                                );

                        if (existedCourse == null)
                        {
                            await _progressRepository.AddUserProgress(
                                new UserProgress
                                {
                                    UserId = userId,
                                    RefType =
                                        common.Constant.RefType.Course,
                                    RefId = firstCourse.CourseId,
                                    AssignedDate = DateTime.Now,
                                    Status = false
                                }
                            );
                        }

                        var firstUnit =
                            (await _unitRepository.GetAllUnits(
                                firstCourse.CourseId,
                                true
                            ))
                            .OrderBy(x => x.OrderIndex)
                            .FirstOrDefault();

                        if (firstUnit != null)
                        {
                            var existedUnit =
                                await _progressRepository
                                    .GetUserUnitByUnitId(
                                        userId,
                                        firstUnit.UnitId,
                                        common.Constant.RefType.Unit
                                    );

                            if (existedUnit == null)
                            {
                                await _progressRepository.AddUserProgress(
                                    new UserProgress
                                    {
                                        UserId = userId,
                                        RefType =
                                            common.Constant.RefType.Unit,
                                        RefId = firstUnit.UnitId,
                                        AssignedDate = DateTime.Now,
                                        Status = false
                                    }
                                );
                            }
                        }
                    }
                }
                await _progressRepository.Save();

                return;
            }
        }

        /* xem bài kiểm tra đã làm xong
         * O(1)
         * thuphuong21072004
         */
        public async Task<UserQuizDTO?> GetMyQuizResult(int quizId)
        {
            int currentUserId = _userContext.GetUserId();
            var result = await _userQuizRepository.GetUserQuiz(currentUserId, quizId);
            if (result == null) return null;
            return _mapper.Map<UserQuizDTO>(result);
        }

        /* xem lịch sửa đáp án đã chọn
         * O(n)
         * thuphuong21072004
         */
        public async Task<List<UserAnswerDTO>> GetUserAnswerRaw(int quizId)
        {
            int currentUserId = _userContext.GetUserId();
            return await _userAnswerRepository.GetUserAnswers(currentUserId, quizId);
        }

        /* lấy danh sách bài kiểm tra vượt cấp
         * O(n)
         * thuphuong21072004
         */
        public async Task<List<PlacementTestDTO>> GetPlacements()
        {
            var data = await _placementRepository.GetPlacements();
            return _mapper.Map<List<PlacementTestDTO>>(data);
        }

        /* lưu bài kiểm tra vượt cấp
         * O(1)
         * thuphuong21072004
         */
        public async Task<PlacementTestDTO> SavePlacement(PlacementTestDTO dto)
        {
            if (!ValidateAdmin() && !ValidateModerator())
            {
                throw new UnauthorizedAccessException("You do not have course management privileges.");
            }

            PlacementTest placement;

            if (dto.PlacementId > 0)
            {
                placement = await _placementRepository.GetPlacementById(dto.PlacementId);

                if (placement == null)
                {
                    throw new Exception("Placement not found");
                }

                placement.Name = dto.Name;
                placement.Description = dto.Description;
            }

            else
            {
                placement = _mapper.Map<PlacementTest>(dto);

                await _placementRepository.AddPlacement(placement);
            }

            await _placementRepository.Save();

            return _mapper.Map<PlacementTestDTO>(placement);
        }
        /* xóa bài kiểm tra vợt cấp 
         * O(1)
         * thuphuong21072004
         */
        public async Task DeletePlacement(int id)
        {
            if (!ValidateAdmin())
            {
                throw new UnauthorizedAccessException("You do not have course management privileges.");
            }
            var placement = await _placementRepository.GetPlacementById(id);
            if (placement == null) throw new Exception("Placement not found");
            await _placementRepository.DeletePlacement(placement);
            await _placementRepository.Save();
        }
    }
}