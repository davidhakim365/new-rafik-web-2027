using Azure.Core;
using EFCore.BulkExtensions;
using LearnMS.API.Common;
using LearnMS.API.Common.StorageService;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Courses.Contracts;
using LearnMS.API.Features.Profile;
using LearnMS.API.Features.Students;
using LearnMS.API.ThirdParties;
using LearnMS.API.ThirdParties.VdoCipher;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LearnMS.API.Features.Courses;

public sealed class CoursesService : ICoursesService
{
    private readonly AppDbContext _context;
    private readonly VdoService _vdoService;
    private readonly IOptions<StorageConfig> _storageCfg;
    private readonly StorageService _storageService;

    public CoursesService(
        AppDbContext contextContext,
        VdoService vdoService,
        IOptions<StorageConfig> storageCfg,
        StorageService storageService
    )
    {
        _context = contextContext;
        _vdoService = vdoService;
        _storageCfg = storageCfg;
        _storageService = storageService;
    }

    public async Task ExecuteAsync(CreateLectureCommand command)
    {
        var course =
            await _context
                .Courses.Include(x => x.Lectures)
                .FirstOrDefaultAsync(x => x.Id == command.CourseId)
            ?? throw new ApiException(CoursesErrors.NotFound);

        var lecture = new Lecture { Title = command.Title };
        course.AddItem(lecture);
        _context.Courses.Update(course);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(UpdateLectureCommand command)
    {
        var lecture =
            await _context.Lectures.FirstOrDefaultAsync(x =>
                x.Id == command.Id && x.CourseId == command.CourseId
            ) ?? throw new ApiException(LecturesErrors.NotFound);

        if (!string.IsNullOrEmpty(command.Title))
            lecture.Title = command.Title;

        if (!string.IsNullOrEmpty(command.Description))
            lecture.Description = command.Description;

        if (!string.IsNullOrEmpty(command.ImageUrl))
            lecture.ImageUrl = command.ImageUrl;

        if (command.Price is not null)
            lecture.Price = command.Price.Value;

        if (command.RenewalPrice is not null)
            lecture.RenewalPrice = command.RenewalPrice.Value;

        if (command.ExpirationDays is not null)
            lecture.ExpirationDays = command.ExpirationDays;

        _context.Update(lecture);

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(PublishLectureCommand command)
    {
        var lecture =
            await _context.Lectures.FirstOrDefaultAsync(x =>
                x.Id == command.Id && x.CourseId == command.CourseId
            ) ?? throw new ApiException(LecturesErrors.NotFound);

        if (!lecture.IsPublishable)
            throw new ApiException(LecturesErrors.NotPublishable);

        lecture.IsPublished = true;

        _context.Update(lecture);

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(UnPublishLectureCommand command)
    {
        var lecture =
            await _context.Lectures.FirstOrDefaultAsync(x => x.Id == command.Id)
            ?? throw new ApiException(LecturesErrors.NotFound);

        lecture.IsPublished = false;

        _context.Update(lecture);

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(CreateLessonCommand command)
    {
        var lecture =
            await _context
                .Lectures.Include(x => x.Lessons)
                .Include(x => x.Quizzes)
                .FirstOrDefaultAsync(x =>
                    x.Id == command.LectureId && x.CourseId == command.CourseId
                ) ?? throw new ApiException(LecturesErrors.NotFound);

        var lesson = new Lesson
        {
            Title = command.Title,
            RenewalPrice = command.RenewalPrice,
            ExpirationHours = command.ExpirationHours,
            Description = command.Description
        };

        lecture.AddItem(lesson);

        _context.Lectures.Update(lecture);

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(UpdateLessonCommand command)
    {
        var lecture =
            await _context
                .Lectures.Include(x => x.Lessons.Where(x => x.Id == command.Id))
                .FirstOrDefaultAsync(x =>
                    x.Id == command.LectureId && x.CourseId == command.CourseId
                ) ?? throw new ApiException(LecturesErrors.NotFound);

        var lesson =
            lecture.Lessons.FirstOrDefault(x => x.Id == command.Id)
            ?? throw new ApiException(LessonsErrors.NotFound);

        if (!string.IsNullOrWhiteSpace(command.Title))
            lesson.Title = command.Title;

        if (!string.IsNullOrWhiteSpace(command.Description))
            lesson.Description = command.Description;

        if (command.ExpirationHours is not null && command.ExpirationHours > 0)
            lesson.ExpirationHours = command.ExpirationHours.Value;

        if (command.RenewalPrice is not null)
            lesson.RenewalPrice = command.RenewalPrice.Value;

        if (!string.IsNullOrWhiteSpace(command.VideoId))
        {
            lesson.VideoId = command.VideoId;
        }

        _context.Lessons.Update(lesson);

        await _context.SaveChangesAsync();
    }

    public async Task<CreateCourseResult> ExecuteAsync(CreateCourseCommand command)
    {
        var course = new Course { Id = Guid.NewGuid(), Title = command.Title };

        await _context.Courses.AddAsync(course);
        await _context.SaveChangesAsync();

        return new CreateCourseResult(course.Id);
    }

    public async Task ExecuteAsync(UpdateCourseCommand command)
    {
        var course = await _context.Courses.FirstOrDefaultAsync(x => x.Id == command.Id);

        if (course is null)
            throw new ApiException(CoursesErrors.NotFound);

        if (!string.IsNullOrWhiteSpace(command.Title))
            course.Title = command.Title;

        if (!string.IsNullOrWhiteSpace(command.Description))
            course.Description = command.Description;

        if (command.Price is not null)
            course.Price = command.Price;

        if (command.RenewalPrice is not null)
            course.RenewalPrice = command.RenewalPrice;

        if (command.ExpirationDays is not null)
            course.ExpirationDays = command.ExpirationDays;

        if (!string.IsNullOrWhiteSpace(command.ImageUrl))
            course.ImageUrl = command.ImageUrl;

        if (command.Level is not null)
            course.Level = command.Level;

        _context.Courses.Update(course);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(PublishCourseCommand command)
    {
        var course = await _context.Courses.FirstOrDefaultAsync(x => x.Id == command.Id);

        if (course is null)
            throw new ApiException(CoursesErrors.NotFound);

        if (!course.IsPublishable)
            throw new ApiException(CoursesErrors.NotPublishable);

        course.IsPublished = true;

        _context.Courses.Update(course);

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(UnPublishCourseCommand command)
    {
        var course = await _context.Courses.FirstOrDefaultAsync(x => x.Id == command.Id);

        if (course is null)
            throw new ApiException(CoursesErrors.NotFound);

        course.IsPublished = false;

        _context.Courses.Update(course);

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(BuyCourseCommand command)
    {
        var student =
            await _context.Students.FirstOrDefaultAsync(x => x.Id == command.StudentId)
            ?? throw new ApiException(ProfileErrors.NoStudentFound);

        var course =
            await _context
                .Courses.Include(x =>
                    x.CourseEnrollments.Where(x => x.StudentId == command.StudentId).Take(1)
                )
                .FirstOrDefaultAsync(x =>
                    x.Id == command.CourseId && x.IsPublished && x.Level == student.Level
                ) ?? throw new ApiException(CoursesErrors.NotFound);

        student.BuyOrRenewCourse(course);

        _context.Update(student);

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(BuyLectureCommand command)
    {
        var student =
            await _context.Students.FirstOrDefaultAsync(x => x.Id == command.StudentId)
            ?? throw new ApiException(ProfileErrors.NoStudentFound);

        var course =
            await _context
                .Set<Course>()
                .Include(x => x.EnrolledStudents.Where(x => x.Id == command.StudentId).Take(1))
                .Include(x => x.Lectures.Where(x => x.Id == command.LectureId).Take(1))
                .ThenInclude(x => x.EnrolledStudents.Where(x => x.Id == command.StudentId))
                .FirstOrDefaultAsync(x => x.Id == command.CourseId && x.IsPublished)
            ?? throw new ApiException(CoursesErrors.NotFound);

        if (course.Lectures.FirstOrDefault() is not { } lecture)
            throw new ApiException(LecturesErrors.NotFound);

        student.BuyOrRenewLecture(course, lecture);

        var lessonAttendances = await _context
            .Set<LessonAttendance>()
            .Where(x => x.StudentId == command.StudentId && x.Lesson.LectureId == command.LectureId)
            .ToListAsync();

        _context.Update(course);
        _context.RemoveRange(lessonAttendances);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(DeleteCourseCommand command)
    {
        var course =
            _context.Courses.FirstOrDefault(x => x.Id == command.Id)
            ?? throw new ApiException(CoursesErrors.NotFound);

        _context.Remove(course);

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(DeleteLectureCommand command)
    {
        var course =
            await _context
                .Set<Course>()
                .Include(x => x.Exams)
                .Include(x => x.Lectures)
                .FirstOrDefaultAsync(x => x.Id == command.CourseId)
            ?? throw new ApiException(CoursesErrors.NotFound);

        if (
            course.Lectures.FirstOrDefault(x => x.Id == command.Id) is { } lecture
            && !string.IsNullOrWhiteSpace(lecture.ImageUrl)
        )
            course.RemoveItem(command.Id);

        _context.Update(course);

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(DeleteLessonCommand command)
    {
        var lecture =
            await _context
                .Set<Lecture>()
                .Include(x => x.Lessons)
                .Include(x => x.Quizzes)
                .FirstOrDefaultAsync(x =>
                    x.Id == command.LectureId && x.CourseId == command.CourseId
                ) ?? throw new ApiException(LecturesErrors.NotFound);

        lecture.RemoveItem(command.Id);
        _context.Update(lecture);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(RenewLessonExpirationCommand command)
    {
        var student =
            await _context.Students.FirstOrDefaultAsync(x => x.Id == command.StudentId)
            ?? throw new ApiException(StudentsErrors.NotFound);

        var course =
            await _context
                .Set<Course>()
                .Include(x => x.EnrolledStudents.Where(x => x.Id == command.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == command.LectureId))
                .ThenInclude(x =>
                    x.Lessons.Where(x => x.Id == command.LessonId && x.VideoId != null)
                )
                .ThenInclude(x => x.AttendedStudents.Where(x => x.Id == command.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == command.LectureId))
                .ThenInclude(x => x.EnrolledStudents.Where(x => x.Id == command.StudentId))
                .FirstOrDefaultAsync(x => x.Id == command.CourseId && x.IsPublished)
            ?? throw new ApiException(CoursesErrors.NotFound);

        if (course.Lectures.FirstOrDefault(x => x.Id == command.LectureId) is not { } lecture)
            throw new ApiException(LecturesErrors.NotFound);

        if (lecture.Lessons.FirstOrDefault(x => x.Id == command.LessonId) is not { } lesson)
            throw new ApiException(LessonsErrors.NotFound);

        if (
            course.CourseEnrollments.Any(x =>
                    x.StudentId == command.StudentId && x.ExpiresAt > DateTime.UtcNow
                )
                is false
            && lecture.LectureEnrollments.Any(x =>
                    x.StudentId == command.StudentId && x.ExpiresAt > DateTime.UtcNow
                )
                is false
        )
            throw new ApiException(LessonsErrors.NotAccessible);

        student.RenewLesson(lesson);

        _context.Update(student);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(AttendLessonCommand command)
    {
        var course =
            await _context
                .Set<Course>()
                .Include(x => x.EnrolledStudents.Where(x => x.Id == command.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == command.LectureId))
                .ThenInclude(x =>
                    x.Lessons.Where(x => x.Id == command.LessonId && x.VideoId != null)
                )
                .ThenInclude(x => x.AttendedStudents.Where(x => x.Id == command.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == command.LectureId))
                .ThenInclude(x => x.EnrolledStudents.Where(x => x.Id == command.StudentId))
                .FirstOrDefaultAsync(x => x.Id == command.CourseId && x.IsPublished)
            ?? throw new ApiException(CoursesErrors.NotFound);

        if (course.Lectures.FirstOrDefault(x => x.Id == command.LectureId) is not { } lecture)
            throw new ApiException(LecturesErrors.NotFound);

        if (lecture.Lessons.FirstOrDefault(x => x.Id == command.LessonId) is not { } lesson)
            throw new ApiException(LessonsErrors.NotFound);

        if (
            course.CourseEnrollments.Any(x =>
                    x.StudentId == command.StudentId && x.ExpiresAt > DateTime.UtcNow
                )
                is false
            && lecture.LectureEnrollments.Any(x =>
                    x.StudentId == command.StudentId && x.ExpiresAt > DateTime.UtcNow
                )
                is false
        )
            throw new ApiException(LessonsErrors.NotAccessible);

        if (
            lesson.LessonAttendances.FirstOrDefault(x => x.StudentId == command.StudentId)
            is not null
        )
            throw new ApiException(LessonsErrors.AlreadyAcceptedExpirationRule);

        lesson.LessonAttendances.Add(
            new LessonAttendance
            {
                ExpirationDate =
                    lesson.ExpirationHours == 0
                        ? null
                        : DateTime.UtcNow.AddHours(lesson.ExpirationHours),
                StudentId = command.StudentId
            }
        );

        _context.Update(course);

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(UploadLessonVideoCommand command)
    {
        var lesson =
            await _context
                .Set<Lesson>()
                .FirstOrDefaultAsync(x =>
                    x.Id == command.LessonId
                    && x.LectureId == command.LectureId
                    && x.Lecture.CourseId == command.CourseId
                ) ?? throw new ApiException(LessonsErrors.NotFound);

        var videoId = await _vdoService.UploadVideoAsync(command.FS, lesson.VideoId);
        lesson.VideoId = videoId;

        _context.Update(lesson);

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(ChangeLectureHomeworkScoreCommand command)
    {
        var lecture =
            await _context
                .Set<Lecture>()
                .FirstOrDefaultAsync(x =>
                    x.Id == command.LectureId
                    && x.CourseId == command.CourseId
                    && x.CourseId == command.CourseId
                ) ?? throw new ApiException(LecturesErrors.NotFound);

        var student =
            await _context.Students.FirstOrDefaultAsync(x => x.Id == command.StudentId)
            ?? throw new ApiException(StudentsErrors.NotFound);

        var homework = await _context
            .Set<LectureHomework>()
            .FirstOrDefaultAsync(x =>
                x.LectureId == command.LectureId && x.StudentId == command.StudentId
            );

        if (homework is null)
        {
            homework = new LectureHomework
            {
                LectureId = command.LectureId,
                StudentId = command.StudentId,
                Score = command.Score
            };
            await _context.AddAsync(homework);
        }
        else
        {
            homework.Score = command.Score;
            _context.Update(homework);
        }

        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(ChangeLectureQuizScoreCommand command)
    {
        var lecture =
            await _context
                .Set<Lecture>()
                .FirstOrDefaultAsync(x =>
                    x.Id == command.LectureId
                    && x.CourseId == command.CourseId
                    && x.CourseId == command.CourseId
                ) ?? throw new ApiException(LecturesErrors.NotFound);

        var student =
            await _context.Students.FirstOrDefaultAsync(x => x.Id == command.StudentId)
            ?? throw new ApiException(StudentsErrors.NotFound);

        var quiz = await _context
            .Set<LectureQuiz>()
            .FirstOrDefaultAsync(x =>
                x.LectureId == command.LectureId && x.StudentId == command.StudentId
            );

        if (quiz is null)
        {
            quiz = new LectureQuiz
            {
                LectureId = command.LectureId,
                StudentId = command.StudentId,
                Score = command.Score
            };
            await _context.AddAsync(quiz);
        }
        else
        {
            quiz.Score = command.Score;
            _context.Update(quiz);
        }

        await _context.SaveChangesAsync();
    }

    public async Task<UpdateQuizResult> ExecuteAsync(UpdateQuizCommand command)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        var lecture =
            await _context
                .Set<Lecture>()
                .Include(x => x.Quizzes)
                .ThenInclude(x => x.Questions.OrderBy(x => x.CreatedAt))
                .Include(x => x.Lessons)
                .FirstOrDefaultAsync(x =>
                    x.Id == command.LectureId && x.CourseId == command.CourseId
                ) ?? throw new ApiException(LecturesErrors.NotFound);

        Quiz quiz;

        var isNew = command.Id == null;

        if (!isNew)
        {
            quiz =
                lecture.Quizzes.FirstOrDefault(x => x.Id == command.Id)
                ?? throw new ApiException(QuizzesErrors.NotFound);
        }
        else
        {
            quiz = new Quiz { Id = Guid.NewGuid() };
            lecture.AddItem(quiz);
        }

        quiz.Description = command.Description;
        quiz.Title = command.Title;
        quiz.ResultType = command.ResultType;
        quiz.PassCount = command.PassCount;

        var questions = await _context
            .Set<Question>()
            .Where(x => command.Questions.Contains(x.Id))
            .ToListAsync();

        _context.Update(lecture);
        if (!isNew)
            _context.Update(quiz);
        else
            await _context.AddAsync(quiz);
        await _context.SaveChangesAsync();

        quiz.QuizQuestions.Clear();
        _context.Update(quiz);
        await _context.SaveChangesAsync();

        foreach (var question in questions)
            if (question.Body is MultipleChoiceQuestion)
                quiz.Questions.Add(question);
            else
                quiz.Questions.Add(question);
        _context.Update(quiz);
        await _context.SaveChangesAsync();

        await transaction.CommitAsync();

        return new UpdateQuizResult
        {
            PassCount = quiz.PassCount,
            Description = quiz.Description,
            ResultType = quiz.ResultType,
            Title = quiz.Title,
            Id = quiz.Id,
            Questions = questions
        };
    }

    public async Task ExecuteAsync(DeleteQuizCommand command)
    {
        var lecture =
            await _context
                .Set<Lecture>()
                .Include(x => x.Lessons)
                .Include(x => x.Quizzes)
                .FirstOrDefaultAsync(x =>
                    x.Id == command.LectureId && x.CourseId == command.CourseId
                ) ?? throw new ApiException(LecturesErrors.NotFound);

        lecture.RemoveItem(command.Id);
        _context.Update(lecture);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(SubmitQuizCommand command)
    {
        var course =
            await _context
                .Set<Course>()
                .Include(x => x.EnrolledStudents.Where(x => x.Id == command.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == command.LectureId))
                .ThenInclude(x => x.Quizzes.Where(x => x.Id == command.QuizId))
                .ThenInclude(x => x.SubmittedStudents.Where(x => x.Id == command.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == command.LectureId))
                .ThenInclude(x => x.Quizzes.Where(x => x.Id == command.QuizId))
                .ThenInclude(x => x.Questions)
                .Include(x => x.Lectures.Where(x => x.Id == command.LectureId))
                .ThenInclude(x => x.Quizzes.Where(x => x.Id == command.QuizId))
                .ThenInclude(x => x.SubmittedStudents.Where(x => x.Id == command.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == command.LectureId))
                .ThenInclude(x => x.EnrolledStudents.Where(x => x.Id == command.StudentId))
                .FirstOrDefaultAsync(x => x.Id == command.CourseId && x.IsPublished)
            ?? throw new ApiException(CoursesErrors.NotFound);

        if (course.Lectures.FirstOrDefault(x => x.Id == command.LectureId) is not { } lecture)
            throw new ApiException(LecturesErrors.NotFound);

        if (lecture.Quizzes.FirstOrDefault(x => x.Id == command.QuizId) is not { } quiz)
            throw new ApiException(QuizzesErrors.NotFound);

        if (
            course.CourseEnrollments.Any(x =>
                    x.StudentId == command.StudentId && x.ExpiresAt > DateTime.UtcNow
                )
                is false
            && lecture.LectureEnrollments.Any(x =>
                    x.StudentId == command.StudentId && x.ExpiresAt > DateTime.UtcNow
                )
                is false
        )
            throw new ApiException(QuizzesErrors.NotAccessible);

        if (
            quiz.QuizSubmissions.FirstOrDefault(x => x.StudentId == command.StudentId) is
            { } submission
        )
            throw new ApiException(QuizzesErrors.AlreadySubmitted);

        var questionsIds = quiz
            .Questions.Select(x => x.Id)
            .Intersect(command.QuestionAnswers.Select(x => x.QuestionId));

        List<QuestionSubmission> questionSubmissions = [];

        foreach (var qId in questionsIds)
        {
            var question = quiz.Questions.Single(x => x.Id == qId);
            var studentQuestion = command.QuestionAnswers.Single(x => x.QuestionId == qId);
            if (question.Body is MultipleChoiceQuestion multipleChoiceQuestion)
                questionSubmissions.Add(
                    new MultipleChoiceSubmission
                    {
                        Choices = multipleChoiceQuestion.Choices,
                        CorrectAnswer = multipleChoiceQuestion.CorrectAnswer,
                        QuestionId = question.Id,
                        StudentAnswer = studentQuestion.Answer
                    }
                );
            else if (question.Body is ValueToleranceQuestion valueToleranceQuestion)
                questionSubmissions.Add(
                    new ValueToleranceSubmission
                    {
                        QuestionId = question.Id,
                        StudentAnswer = decimal.Parse(studentQuestion.Answer),
                        Tolerance = valueToleranceQuestion.Tolerance,
                        CorrectAnswer = valueToleranceQuestion.CorrectAnswer
                    }
                );
        }

        quiz.QuizSubmissions.Add(
            new QuizSubmission
            {
                QuizId = command.QuizId,
                NumOfQuestions = questionSubmissions.Count(),
                NumOfCorrect = questionSubmissions.Count(x => x.IsCorrect),
                QuestionSubmissions = questionSubmissions,
                PassCount = quiz.PassCount,
                StudentId = command.StudentId
            }
        );
        _context.Update(quiz);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(BuyExamCommand command)
    {
        var student =
            await _context
                .Set<Student>()
                .Include(x =>
                    x.ExamEnrollments.Where(x =>
                        x.ExamId == command.ExamId && x.Exam.CourseId == command.CourseId
                    )
                )
                .ThenInclude(x => x.Submission)
                .FirstOrDefaultAsync(x => x.Id == command.StudentId)
            ?? throw new ApiException(ProfileErrors.NoStudentFound);

        var exam =
            await _context
                .Set<Exam>()
                .FirstOrDefaultAsync(x => x.Id == command.ExamId && x.CourseId == command.CourseId)
            ?? throw new ApiException(ExamsErrors.NotFound);

        student.BuyOrRetakeExam(exam);

        _context.Update(student);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(UpdateLectureAssetsCommand command)
    {
        var lecture =
            await _context
                .Set<Lecture>()
                .Include(x => x.Assets)
                .FirstOrDefaultAsync(x =>
                    x.Id == command.LectureId && x.CourseId == command.CourseId
                ) ?? throw new ApiException(LecturesErrors.NotFound);

        var assets = await _context
            .Set<Asset>()
            .Where(x => command.AssetsIds.Contains(x.Id))
            .ToListAsync();

        lecture.Assets.Clear();

        foreach (var asset in assets)
            lecture.Assets.Add(asset);

        _context.Update(lecture);
        await _context.SaveChangesAsync();
    }

    public async Task<UpdateExamResult> ExecuteAsync(UpdateExamCommand command)
    {
        var course =
            await _context
                .Set<Course>()
                .Include(x => x.Lectures)
                .Include(x => x.Exams)
                .ThenInclude(x => x.Questions)
                .FirstOrDefaultAsync(x => x.Id == command.CourseId)
            ?? throw new ApiException(CoursesErrors.NotFound);

        Exam exam;

        if (course.Exams.FirstOrDefault(x => x.Id == command.Id) is { } existing)
        {
            exam = existing;
        }
        else
        {
            exam = new Exam();
            course.AddItem(exam);
        }

        exam.Title = command.Title;
        exam.Description = command.Description;
        exam.ResultType = command.ResultType;
        exam.Price = command.Price;
        exam.RetakePrice = command.RetakePrice;
        exam.PassCount = command.PassCount;
        exam.ExpiryHours = command.ExpiryHours;
        exam.Questions.Clear();
        var questions = _context.Set<Question>().Where(x => command.Questions.Contains(x.Id));
        foreach (var q in questions)
            exam.Questions.Add(q);

        _context.Update(exam);
        await _context.SaveChangesAsync();

        return new UpdateExamResult
        {
            Id = exam.Id,
            Description = exam.Description,
            PassCount = exam.PassCount,
            Price = exam.Price,
            Questions = exam.Questions,
            ResultType = exam.ResultType,
            ExpiryHours = exam.ExpiryHours,
            RetakePrice = exam.RetakePrice,
            Title = exam.Title
        };
    }

    public async Task ExecuteAsync(DeleteExamCommand command)
    {
        var course =
            await _context
                .Set<Course>()
                .Include(x => x.Exams)
                .Include(x => x.Lectures)
                .FirstOrDefaultAsync(x => x.Id == command.CourseId)
            ?? throw new ApiException(CoursesErrors.NotFound);

        course.RemoveItem(command.Id);

        _context.Update(course);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(SubmitExamCommand command)
    {
        var exam =
            await _context
                .Set<Exam>()
                .Include(x => x.Questions)
                .Include(x => x.ExamEnrollments.Where(x => x.StudentId == command.StudentId))
                .Include(x => x.ExamEnrollments)
                .ThenInclude(x => x.Submission)
                .FirstOrDefaultAsync(x => x.Id == command.ExamId && x.CourseId == command.CourseId)
            ?? throw new ApiException(ExamsErrors.NotFound);

        var enrollment =
            exam.ExamEnrollments.FirstOrDefault(x => x.StudentId == command.StudentId)
            ?? throw new ApiException(ExamsErrors.NotAccessible);

        if (enrollment.Submission != null)
            throw new ApiException(ExamsErrors.AlreadySubmitted);

        if (enrollment.ExpiresAt < DateTime.UtcNow)
        {
            throw new ApiException(ExamsErrors.ExamExpired);
        }

        var questionsIds = exam
            .Questions.Select(x => x.Id)
            .Intersect(command.QuestionAnswers.Select(x => x.QuestionId));

        List<QuestionSubmission> questionSubmissions = [];

        foreach (var qId in questionsIds)
        {
            var question = exam.Questions.Single(x => x.Id == qId);
            var studentQuestion = command.QuestionAnswers.Single(x => x.QuestionId == qId);
            if (question.Body is MultipleChoiceQuestion multipleChoiceQuestion)
                questionSubmissions.Add(
                    new MultipleChoiceSubmission
                    {
                        Choices = multipleChoiceQuestion.Choices,
                        CorrectAnswer = multipleChoiceQuestion.CorrectAnswer,
                        QuestionId = question.Id,
                        StudentAnswer = studentQuestion.Answer
                    }
                );
            else if (question.Body is ValueToleranceQuestion valueToleranceQuestion)
                questionSubmissions.Add(
                    new ValueToleranceSubmission
                    {
                        QuestionId = question.Id,
                        StudentAnswer = decimal.Parse(studentQuestion.Answer),
                        Tolerance = valueToleranceQuestion.Tolerance,
                        CorrectAnswer = valueToleranceQuestion.CorrectAnswer
                    }
                );
        }

        enrollment.Submission = new ExamSubmission
        {
            StudentId = command.StudentId,
            ExamId = exam.Id,
            NumOfQuestions = questionSubmissions.Count(),
            NumOfCorrect = questionSubmissions.Count(x => x.IsCorrect),
            QuestionSubmissions = questionSubmissions,
            PassCount = exam.PassCount
        };
        _context.Update(exam);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(ToggleStudentAttendance command)
    {
        var lecture =
            await _context
                .Set<Lecture>()
                .Include(x => x.LectureAttendances.Where(x => x.StudentId == command.StudentId))
                .FirstOrDefaultAsync(x => x.Id == command.LectureId)
            ?? throw new ApiException(LecturesErrors.NotFound);

        if (
            lecture.LectureAttendances.FirstOrDefault(x => x.StudentId == command.StudentId) is
            { } attendance
        )
            if (command.Attend)
            {
                if (attendance.AttendedAt == null)
                {
                    attendance.AttendedAt = DateTime.UtcNow;
                }
            }
            else
            {
                attendance.AttendedAt = attendance.AttendedAt == null ? DateTime.UtcNow : null;
            }
        else
            lecture.LectureAttendances.Add(
                new LectureAttendance
                {
                    StudentId = command.StudentId,
                    AttendedAt = DateTime.UtcNow
                }
            );

        _context.Update(lecture);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(EnrollStudentInLectureCommand command)
    {
        var lecture =
            await _context
                .Set<Lecture>()
                .Include(x =>
                    x.LectureEnrollments.Where(x => x.StudentId == command.StudentId).Take(1)
                )
                .FirstOrDefaultAsync(x =>
                    x.Id == command.LectureId && x.CourseId == command.CourseId
                ) ?? throw new ApiException(LecturesErrors.NotFound);

        var enrollment = lecture.LectureEnrollments.SingleOrDefault();

        if (enrollment == null)
            lecture.LectureEnrollments.Add(
                new LectureEnrollment
                {
                    StudentId = command.StudentId,
                    ExpiresAt = DateTime.UtcNow.AddDays(lecture.ExpirationDays!.Value)
                }
            );
        else
            enrollment.ExpiresAt = DateTime.UtcNow.AddDays(lecture.ExpirationDays!.Value);

        _context.Update(lecture);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(EnrollStudentInExamCommand command)
    {
        var exam =
            await _context
                .Set<Exam>()
                .Include(x =>
                    x.ExamEnrollments.Where(x => x.StudentId == command.StudentId).Take(1)
                )
                .ThenInclude(x => x.Submission)
                .FirstOrDefaultAsync(x => x.Id == command.ExamId && x.CourseId == command.CourseId)
            ?? throw new ApiException(ExamsErrors.NotFound);

        var enrollment = exam.ExamEnrollments.SingleOrDefault();

        if (enrollment == null)
            exam.ExamEnrollments.Add(
                new ExamEnrollment
                {
                    StudentId = command.StudentId,
                    ExpiresAt = DateTime.UtcNow.AddHours(exam.ExpiryHours)
                }
            );
        else
            enrollment.Submission = null;

        _context.Update(exam);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(RetakeQuizCommand command)
    {
        var quiz =
            await _context
                .Set<Quiz>()
                .Include(x =>
                    x.QuizSubmissions.Where(x => x.StudentId == command.StudentId).Take(1)
                )
                .FirstOrDefaultAsync(x =>
                    x.Id == command.QuizId
                    && x.LectureId == command.LectureId
                    && x.Lecture.CourseId == command.CourseId
                ) ?? throw new ApiException(QuizzesErrors.NotFound);

        quiz.QuizSubmissions.RemoveAll(x => x.StudentId == command.StudentId);

        _context.Update(quiz);
        await _context.SaveChangesAsync();
    }

    public async Task ExecuteAsync(UpdateLectureGradesCommand command)
    {
        // Ensure the command is not null
        if (command == null)
        {
            throw new ApiException(new ApiError("Null Command", "The command provided is null.", 400));
        }

        if (command.Grades == null)
        {
            throw new ApiException(new ApiError("Null Grades", "The Grades list in the command is null.", 400));
        }

        if (command.LectureId == Guid.Empty)
        {
            throw new ApiException(new ApiError("Invalid Lecture ID", "The provided Lecture ID is empty.", 400));
        }

        if (command.CourseId == Guid.Empty)
        {
            throw new ApiException(new ApiError("Invalid Course ID", "The provided Course ID is empty.", 400));
        }

        // Fetch the lecture and ensure it exists
        var lecture = await _context.Lectures
            .FirstOrDefaultAsync(x => x.Id == command.LectureId && x.CourseId == command.CourseId);

        if (lecture == null)
        {
            throw new ApiException(new ApiError("Lecture Not Found", "The specified lecture was not found.", 404));
        }

        // Extract student codes from the command
        var codes = command.Grades.Select(g => g.Code).ToList();

        if (!codes.Any())
        {
            throw new ApiException(new ApiError("No Student ID", "No student ID were provided.", 400));
        }

        // Fetch students that match the provided codes
        var students = await _context.Students
            .Where(s => codes.Contains(s.StudentCode))
            .ToListAsync();

        if (!students.Any())
        {
            throw new ApiException(new ApiError("Students Not Found",
                "No matching students found for the provided codes.", 404));
        }

        // Proceed with further logic
        var homeworks = students.Select(s => new LectureHomework
        {
            StudentId = s.Id,
            Score = 1,
            LectureId = command.LectureId
        }).ToList();

        // Check for existing homeworks
        var studentIds = homeworks.Select(h => h.StudentId).ToList();
        var existingHomeworks = await _context.Set<LectureHomework>()
            .Where(lh => lh.LectureId == command.LectureId && studentIds.Contains(lh.StudentId))
            .ToListAsync();

        // Ensure existingHomeworks is not null
        if (existingHomeworks == null)
        {
            existingHomeworks = new List<LectureHomework>();
        }

        // Update scores for existing homeworks
        foreach (var existingHomework in existingHomeworks)
        {
            if (!homeworks.Any(h => h.StudentId == existingHomework.StudentId))
            {
                var newHomework = homeworks.First(h => h.StudentId == existingHomework.StudentId);
                existingHomework.Score = newHomework.Score;
            }
        }

        // Determine which homeworks are new and need to be added
        var newHomeworks = homeworks
            .Where(h => !existingHomeworks.Any(eh => eh.StudentId == h.StudentId))
            .ToList();

        // Insert new LectureHomework records into the database
        await _context.Set<LectureHomework>().AddRangeAsync(newHomeworks);

        // Save all changes to the database
        await _context.SaveChangesAsync();
    }


    public async Task<GetStudentCoursesResult> QueryAsync(GetStudentCoursesQuery query)
    {
        var student = await _context.Students.FirstOrDefaultAsync(x => x.Id == query.StudentId);

        if (student is null)
            throw new ApiException(ProfileErrors.NoStudentFound);

        var result =
            from courses in _context.Courses
            join studentCourse in _context.Set<CourseEnrollment>()
                on new { CourseId = courses.Id, query.StudentId } equals new
                {
                    studentCourse.CourseId,
                    studentCourse.StudentId
                }
                into groupedStudentCourse
            from gsc in groupedStudentCourse.DefaultIfEmpty()
            where courses.IsPublished && courses.Level == student.Level
            select new SingleStudentCourse
            {
                Id = courses.Id,
                Title = courses.Title,
                Level = courses.Level,
                Description = courses.Description,
                ExpiresAt = gsc != null ? gsc.ExpiresAt : null,
                Enrollment =
                    gsc != null
                        ? gsc.ExpiresAt > DateTime.UtcNow
                            ? "Active"
                            : "Expired"
                        : "NotEnrolled",
                RenewalPrice = courses.RenewalPrice,
                Price = courses.Price,
                ImageUrl = courses.ImageUrl
            };

        return new GetStudentCoursesResult { Items = await result.ToListAsync() };
    }

    public async Task<GetCoursesResult> QueryAsync(GetCoursesQuery query)
    {
        var courses =
            from c in _context.Set<Course>()
            select new SingleCourse
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                Level = c.Level,
                IsPublished = c.IsPublished,
                Price = c.Price,
                RenewalPrice = c.RenewalPrice
            };

        if (query.IsPublished is not null)
            courses = courses.Where(x => x.IsPublished);

        return new GetCoursesResult { Items = await courses.OrderBy(x => x.Level).ToListAsync() };
    }

    public async Task<GetDashboardCourseResult> QueryAsync(GetCourseQuery query)
    {
        var course =
            await _context
                .Courses.Include(x => x.Lectures)
                .Include(x => x.Exams)
                .FirstOrDefaultAsync(x => x.Id == query.Id)
            ?? throw new ApiException(CoursesErrors.NotFound);

        var lectures = course
            .Lectures.OrderBy(i => i.Order)
            .Select(l => new SingleCourseItem
            {
                Id = l.Id,
                ImageUrl = l.ImageUrl,
                Order = l.Order,
                Title = l.Title,
                Type = CourseItemType.Lecture,
                IsImportant = l.IsImportant
            });

        var exams = course
            .Exams.OrderBy(i => i.Order)
            .Select(e => new SingleCourseItem
            {
                Id = e.Id,
                Order = e.Order,
                Title = e.Title,
                Type = CourseItemType.Exam,
                IsImportant = false
            });

        var items = exams.Union(lectures).OrderBy(x => x.Order).ToList();

        return new GetDashboardCourseResult
        {
            Level = course.Level,
            ExpirationDays = course.ExpirationDays,
            Id = course.Id,
            IsPublished = course.IsPublished,
            Title = course.Title,
            Description = course.Description,
            ImageUrl = course.ImageUrl,
            Price = course.Price,
            RenewalPrice = course.RenewalPrice,
            Items = items
        };
    }

    public async Task<GetStudentCourseResult> QueryAsync(GetStudentCourseQuery query)
    {
        var student =
            await _context.Set<Student>().FirstOrDefaultAsync(x => x.Id == query.StudentId)
            ?? throw new ApiException(ProfileErrors.NoStudentFound);

        var course =
            await _context
                .Set<Course>()
                .Include(x => x.EnrolledStudents.Where(x => x.Id == query.StudentId))
                .Include(x => x.Lectures)
                .ThenInclude(x => x.EnrolledStudents)
                .Include(x => x.Exams)
                .FirstOrDefaultAsync(x =>
                    x.Id == query.Id && x.IsPublished && x.Level == student.Level
                ) ?? throw new ApiException(CoursesErrors.NotFound);

        var lectures = course.Lectures.Select(l => new SingleStudentCourseItem
        {
            ExpiresAt = l
                .LectureEnrollments.FirstOrDefault(x => x.StudentId == query.StudentId)
                ?.ExpiresAt,
            Id = l.Id,
            ImageUrl = l.ImageUrl,
            Order = l.Order,
            Description = l.Description,
            Title = l.Title,
            Type = CourseItemType.Lecture,
            IsImportant = l.IsImportant
        });

        var exams = course.Exams.Select(e => new SingleStudentCourseItem
        {
            Id = e.Id,
            Order = e.Order,
            Title = e.Title,
            Type = CourseItemType.Exam,
            Description = e.Description,
            IsImportant = false
        });

        var items = exams.Union(lectures).OrderBy(x => x.Order).ToList();

        return new GetStudentCourseResult
        {
            ExpirationDays = course.ExpirationDays!.Value,
            Id = course.Id,
            Level = course.Level!.Value,
            Title = course.Title,
            Description = course.Description!,
            ImageUrl = course.ImageUrl!,
            Price = course.Price!.Value,
            RenewalPrice = course.RenewalPrice!.Value,
            ExpiresAt = course
                .CourseEnrollments.FirstOrDefault(x => x.StudentId == query.StudentId)
                ?.ExpiresAt,
            Items = items
        };
    }

    public async Task<GetLectureResult> QueryAsync(GetLectureQuery query)
    {
        var lecture =
            await _context
                .Set<Lecture>()
                .Where(x =>
                    x.Id == query.LectureId
                    && x.Course.Id == query.CourseId
                    && (
                        query.IsCoursePublished == null
                        || x.Course.IsPublished == query.IsCoursePublished
                    )
                    && (query.IsPublished == null || x.IsPublished == query.IsPublished)
                )
                .Include(x => x.Quizzes)
                .Include(x => x.Assets)
                .Include(x => x.Lessons)
                .FirstOrDefaultAsync() ?? throw new ApiException(LecturesErrors.NotFound);

        var lesson = lecture
            .Lessons.OrderBy(i => i.Order)
            .Select(l => new SingleLectureItem
            {
                Id = l.Id,
                Title = l.Title,
                Order = l.Order,
                Type = LectureItemType.Lesson,
                Description = l.Description
            });

        var quizzes = lecture
            .Quizzes.OrderBy(i => i.Order)
            .Select(q => new SingleLectureItem
            {
                Id = q.Id,
                Title = q.Title,
                Order = q.Order,
                Type = LectureItemType.Quiz,
                Description = q.Description
            });

        var result = new GetLectureDashboardResult
        {
            Id = lecture.Id,
            CourseId = lecture.CourseId,
            ExpirationDays = lecture.ExpirationDays,
            Title = lecture.Title,
            Description = lecture.Description,
            ImageUrl = lecture.ImageUrl,
            IsPublished = lecture.IsPublished,
            Price = lecture.Price,
            RenewalPrice = lecture.RenewalPrice,
            Assets = lecture.Assets,
            Items = lesson.Union(quizzes).OrderBy(x => x.Order).ToList(),
            IsImportant = lecture.IsImportant
        };

        return result;
    }

    public async Task<GetStudentLectureResult> QueryAsync(GetStudentLectureQuery query)
    {
        var student =
            await _context.Set<Student>().FirstOrDefaultAsync(x => x.Id == query.StudentId)
            ?? throw new ApiException(ProfileErrors.NoStudentFound);

        var course =
            await _context
                .Set<Course>()
                .Include(x => x.Lectures.Where(x => x.Id == query.LectureId))
                .ThenInclude(x => x.EnrolledStudents.Where(x => x.Id == query.StudentId))
                // added
                .Include(x => x.Lectures.Where(x => x.Id == query.LectureId))
                // added
                .ThenInclude(x => x.LectureAttendances.Where(x => x.StudentId == query.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == query.LectureId))
                .ThenInclude(x => x.Assets)
                .Include(x => x.Lectures.Where(x => x.Id == query.LectureId))
                .ThenInclude(x => x.Quizzes)
                .Include(x => x.Lectures.Where(x => x.Id == query.LectureId))
                .ThenInclude(x => x.Lessons.Where(x => x.VideoId != null))
                .Include(x => x.Exams)
                .ThenInclude(x => x.ExamEnrollments.Where(x => x.StudentId == query.StudentId))
                .ThenInclude(x => x.Submission)
                .FirstOrDefaultAsync(x => x.Id == query.CourseId)
            ?? throw new ApiException(CoursesErrors.NotFound);

        if (course.Lectures.FirstOrDefault(x => x.Id == query.LectureId) is not { } lecture)
            throw new ApiException(LecturesErrors.NotFound);

        if (
            course
            .Exams.Where(x => x.Order < lecture.Order)
            .Any(x =>
                !(
                    x.ExamEnrollments.FirstOrDefault(x =>
                        x.StudentId == query.StudentId
                    )?.Submission?.IsPassed ?? false
                )
            )
        )
            throw new ApiException(LecturesErrors.NotAccessible);

        var lessons = lecture.Lessons.Select(l => new SingleLectureItem
        {
            Id = l.Id,
            Title = l.Title,
            Order = l.Order,
            Type = LectureItemType.Lesson,
            Description = l.Description
        });

        var quizzes = lecture.Quizzes.Select(q => new SingleLectureItem
        {
            Id = q.Id,
            Title = q.Title,
            Order = q.Order,
            Type = LectureItemType.Quiz,
            Description = q.Description
        });

        var expiresAt = lecture
            .LectureEnrollments.FirstOrDefault(x => x.StudentId == query.StudentId)
            ?.ExpiresAt;


        // Check if there are quizzes for the lecture
        var hasQuizzes = _context.Lectures.Any(l => l.Quizzes.Any(q => q.LectureId == query.LectureId));

        // Check if the student has completed all required quizzes
        var hasCompletedQuizzes = _context.Students
            .Any(s => s.QuizSubmissions.Any(lq =>
                lq.StudentId == query.StudentId &&
                lq.NumOfCorrect >= lq.PassCount)); // This ensures all quizzes for this lecture are completed

        var hasAttendedLecture = lecture.LectureAttendances
            .Any(la => la.StudentId == query.StudentId && la.AttendedAt != null);
        // Determine if assets should be shown
        var assets =
            (hasQuizzes && hasCompletedQuizzes) || hasAttendedLecture || (!hasQuizzes && expiresAt != null)
                ? lecture.Assets
                : []; // Hide the assets otherwise


        return new GetStudentLectureResult
        {
            Id = lecture.Id,
            Title = lecture.Title,
            Description = lecture.Description,
            CourseId = lecture.CourseId,
            ExpiresAt = expiresAt,
            ImageUrl = lecture.ImageUrl!,
            Price = lecture.Price!.Value,
            ExpirationDays = lecture.ExpirationDays!.Value,
            RenewalPrice = lecture.RenewalPrice!.Value,
            IsPublished = lecture!.IsPublished,
            // added
            Assets = assets,
            Items = lessons.Union(quizzes).OrderBy(x => x.Order).ToList(),
            IsImportant = lecture.IsImportant
        };
    }

    public async Task<GetStudentLessonResult> QueryAsync(GetStudentLessonQuery query)
    {
        var course =
            await _context
                .Set<Course>()
                .Include(x => x.EnrolledStudents.Where(x => x.Id == query.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == query.LectureId))
                .ThenInclude(x => x.Lessons.Where(x => x.Id == query.LessonId && x.VideoId != null))
                .ThenInclude(x => x.AttendedStudents.Where(x => x.Id == query.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == query.LectureId))
                .ThenInclude(x => x.EnrolledStudents.Where(x => x.Id == query.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == query.LectureId))
                .ThenInclude(x => x.Quizzes)
                .ThenInclude(x => x.SubmittedStudents.Where(x => x.Id == query.StudentId))
                .FirstOrDefaultAsync(x => x.Id == query.CourseId && x.IsPublished)
            ?? throw new ApiException(CoursesErrors.NotFound);

        if (course.Lectures.FirstOrDefault(x => x.Id == query.LectureId) is not { } lecture)
            throw new ApiException(LecturesErrors.NotFound);

        if (lecture.Lessons.FirstOrDefault(x => x.Id == query.LessonId) is not { } lesson)
            throw new ApiException(LessonsErrors.NotFound);

        if (
            course.CourseEnrollments.Any(x =>
                    x.StudentId == query.StudentId && x.ExpiresAt > DateTime.UtcNow
                )
                is false
            && lecture.LectureEnrollments.Any(x =>
                    x.StudentId == query.StudentId && x.ExpiresAt > DateTime.UtcNow
                )
                is false
        )
            throw new ApiException(LessonsErrors.NotAccessible);

        foreach (var quiz in lecture.Quizzes.Where(x => x.Order < lesson.Order))
            if (
                quiz.QuizSubmissions.FirstOrDefault(x => x.StudentId == query.StudentId)
                    is not { } submission
                || submission.NumOfCorrect < quiz.PassCount
            )
                throw new ApiException(LessonsErrors.Blocked);

        var attendance = lesson
            .LessonAttendances
            .FirstOrDefault(x => x.StudentId == query.StudentId);

        return new GetStudentLessonResult()
        {
            Id = lesson.Id,
            Title = lesson.Title,
            Description = lesson.Description,
            VideoOTP =
                lesson.ExpirationHours == 0 || attendance?.ExpirationDate > DateTime.UtcNow
                    ? await _vdoService.GetVideoOTPAsync(lesson.VideoId!)
                    : null,
            ExpirationHours = lesson.ExpirationHours,
            ExpiresAt = attendance?.ExpirationDate,
            RenewalPrice = lesson.RenewalPrice
        };
        ;
    }

    public async Task<GetDashboardLessonResult> QueryAsync(GetLessonQuery query)
    {
        var result =
            await _context
                .Set<Lesson>()
                .FirstOrDefaultAsync(x =>
                    x.Id == query.LessonId
                    && x.Lecture.CourseId == query.CourseId
                    && x.LectureId == query.LectureId
                ) ?? throw new ApiException(LessonsErrors.NotFound);

        return new GetDashboardLessonResult()
        {
            Description = result.Description,
            ExpirationHours = result.ExpirationHours,
            VideoId = result.VideoId,
            Id = result.Id,
            RenewalPrice = result.RenewalPrice,
            Title = result.Title,
            VideoOTP = !string.IsNullOrEmpty(result.VideoId)
                ? await _vdoService.GetVideoOTPAsync(result.VideoId)
                : null
        };
    }

    public async Task<PageList<SingleLectureStudent>> QueryAsync(GetLectureStudentsQuery query)
    {
        var search = query.Search?.Trim().ToLower();

        var lecture =
            await _context
                .Set<Lecture>()
                .Include(x => x.Lessons)
                .Include(x => x.Course)
                .Include(x => x.Quizzes)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == query.LectureId)
            ?? throw new ApiException(LecturesErrors.NotFound);

        var studentsQuery = _context
            .Set<Student>()
            .Where(x => x.Level == lecture.Course.Level)
            .Include(x => x.Accounts)
            .Include(x => x.LectureHomeworks.Where(x => x.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureQuizzes.Where(x => x.LectureId == query.LectureId).Take(1))
            .Include(x => x.AttendedLessons.Where(x => x.LectureId == query.LectureId))
            .Include(x => x.LectureAttendances.Where(x => x.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureEnrollments.Where(x => x.LectureId == query.LectureId).Take(1))
            .Include(x => x.QuizSubmissions.Where(x => x.Quiz.LectureId == query.LectureId))
            .ThenInclude(x => x.Quiz)
            .OrderBy(x => x.StudentCode)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(search))
            studentsQuery = studentsQuery.Where(x =>
                x.FullName.ToLower().Contains(search)
                || x.StudentCode.ToLower().Contains(search)
                || x.Accounts.First().Email.ToLower().Contains(search)
            );

        var students = await PageList<Student>.CreateAsync(
            studentsQuery,
            query.Page,
            query.PageSize
        );

        List<SingleLectureStudent> result = new();

        foreach (var student in students.Items)
        {
            var attendance = student.LectureAttendances.SingleOrDefault();

            var enrollment = student.LectureEnrollments.SingleOrDefault(x => x.LectureId == query.LectureId);

            // Safely handle Accounts collection
            var account = student.Accounts.SingleOrDefault();
            if (account == null)
            {
                // Handle missing account case (e.g., skip or log the issue)
                continue;
            }

            result.Add(
                new SingleLectureStudent
                {
                    Id = student.Id,
                    Email = account.Email,
                    FullName = student.FullName,
                    StudentCode = student.StudentCode,
                    HomeworkScore = student.LectureHomeworks.SingleOrDefault()?.Score,
                    QuizScore = student.LectureQuizzes.SingleOrDefault()?.Score,
                    StudentQuizzesScore = student.QuizSubmissions.Sum(x => x.NumOfCorrect),
                    TotalQuizzesScore = student.QuizSubmissions.Sum(x => x.NumOfQuestions),
                    Attended = attendance is { AttendedAt: not null },
                    Enrolled = enrollment != null,
                }
            );
        }

        return new PageList<SingleLectureStudent>(
            result,
            students.Page,
            students.PageSize,
            students.TotalCount
        );
    }

    public async Task<QuizResult> QueryAsync(GetQuizQuery query)
    {
        var result =
            await _context
                .Set<Quiz>()
                .Include(x => x.Questions)
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == query.Id
                    && x.LectureId == query.LectureId
                    && x.Lecture.CourseId == query.CourseId
                ) ?? throw new ApiException(QuizzesErrors.NotFound);

        return new QuizDashboard()
        {
            Id = result.Id,
            PassCount = result.PassCount,
            Description = result.Description,
            Title = result.Title,
            Questions = result.Questions.OrderBy(q => q.CreatedAt).ToList(),
            ResultType = result.ResultType
        };
    }

    public async Task<QuizResult> QueryAsync(GetStudentQuizQuery query)
    {
        var course =
            await _context
                .Set<Course>()
                .AsNoTracking()
                .Include(x => x.CourseEnrollments.Where(x => x.StudentId == query.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == query.LectureId))
                .ThenInclude(x => x.Quizzes.Where(x => x.Id == query.QuizId))
                .ThenInclude(x => x.QuizSubmissions.Where(x => x.StudentId == query.StudentId))
                .Include(x => x.Lectures.Where(x => x.Id == query.LectureId))
                .ThenInclude(x => x.Quizzes.Where(x => x.Id == query.QuizId))
                .ThenInclude(x => x.Questions.OrderBy(x => x.CreatedAt))
                .Include(x => x.Lectures.Where(x => x.Id == query.LectureId))
                .ThenInclude(x => x.LectureEnrollments.Where(x => x.StudentId == query.StudentId))
                .FirstOrDefaultAsync(x => x.Id == query.CourseId && x.IsPublished)
            ?? throw new ApiException(CoursesErrors.NotFound);

        if (course.Lectures.FirstOrDefault(x => x.Id == query.LectureId) is not { } lecture)
            throw new ApiException(LecturesErrors.NotFound);

        if (lecture.Quizzes.FirstOrDefault(x => x.Id == query.QuizId) is not { } quiz)
            throw new ApiException(QuizzesErrors.NotFound);

        if (
            course.CourseEnrollments.Any(x =>
                    x.StudentId == query.StudentId && x.ExpiresAt > DateTime.UtcNow
                )
                is false
            && lecture.LectureEnrollments.Any(x =>
                    x.StudentId == query.StudentId && x.ExpiresAt > DateTime.UtcNow
                )
                is false
        )
            throw new ApiException(QuizzesErrors.NotAccessible);

        var submission = quiz.QuizSubmissions.FirstOrDefault(x => x.StudentId == query.StudentId);

        if (submission is null)
            return new QuizNotAnswered
            {
                Description = quiz.Description,
                Title = quiz.Title,
                Id = quiz.Id,
                MultipleChoiceQuestions = quiz
                    .Questions.Where(q => q.Body is MultipleChoiceQuestion)
                    .Select(q => new MultipleChoiceNotAnswered
                    {
                        Choices = (q.Body as MultipleChoiceQuestion)!.Choices,
                        Description = q.Description,
                        Id = q.Id,
                        Image = q.Image,
                        Text = q.Text
                    })
                    .ToList(),
                ValueToleranceQuestions = quiz
                    .Questions.Where(q => q.Body is ValueToleranceQuestion)
                    .Select(q => new ValueToleranceNotAnswered
                    {
                        Description = q.Description,
                        Id = q.Id,
                        Image = q.Image,
                        Text = q.Text,
                        Tolerance = (q.Body as ValueToleranceQuestion)!.Tolerance
                    })
                    .ToList(),
                PassCount = quiz.PassCount
            };

        var questionsById = quiz.Questions.ToDictionary(q => q.Id);

        if (quiz.ResultType == ResultType.ResultWithAnswer)
            return new QuizResultWithAnswer
            {
                Description = quiz.Description,
                NumOfCorrect = submission.NumOfCorrect,
                NumOfQuestions = submission.QuestionSubmissions.Count,
                MultipleChoiceQuestions = submission
                    .QuestionSubmissions.OfType<MultipleChoiceSubmission>()
                    .Select(x => new MultipleChoiceWithCorrectAnswer
                    {
                        Choices = x.Choices,
                        CorrectAnswer = x.CorrectAnswer,
                        Id = x.QuestionId,
                        IsCorrect = x.IsCorrect,
                        StudentAnswer = x.StudentAnswer,
                        Description = questionsById[x.QuestionId].Description,
                        Image = questionsById[x.QuestionId].Image,
                        Text = questionsById[x.QuestionId].Text
                    })
                    .ToList(),
                ValueToleranceQuestions = submission
                    .QuestionSubmissions.OfType<ValueToleranceSubmission>()
                    .Select(x => new ValueToleranceWithCorrectAnswer
                    {
                        CorrectAnswer = x.CorrectAnswer,
                        IsCorrect = x.IsCorrect,
                        Id = x.QuestionId,
                        Description = questionsById[x.QuestionId].Description,
                        Image = questionsById[x.QuestionId].Image,
                        StudentAnswer = x.StudentAnswer,
                        Text = questionsById[x.QuestionId].Text,
                        Tolerance = x.Tolerance
                    })
                    .ToList(),
                PassCount = quiz.PassCount,
                Title = quiz.Title,
                Id = quiz.Id
            };

        if (quiz.ResultType == ResultType.ResultOnly)
            return new QuizResultOnly
            {
                Description = quiz.Description,
                NumOfQuestions = submission.QuestionSubmissions.Count,
                PassCount = quiz.PassCount,
                Title = quiz.Title,
                Id = quiz.Id,
                MultipleChoiceQuestions = submission
                    .QuestionSubmissions.OfType<MultipleChoiceSubmission>()
                    .Select(x => new MultipleChoiceWithStudentAnswer
                    {
                        Choices = x.Choices,
                        Description = questionsById[x.QuestionId].Description,
                        Image = questionsById[x.QuestionId].Image,
                        Text = questionsById[x.QuestionId].Text,
                        StudentAnswer = x.StudentAnswer,
                        Id = x.QuestionId
                    })
                    .ToList(),
                ValueToleranceQuestions = submission
                    .QuestionSubmissions.OfType<ValueToleranceSubmission>()
                    .Select(x => new ValueToleranceWithStudentAnswer
                    {
                        Description = questionsById[x.QuestionId].Description,
                        Image = questionsById[x.QuestionId].Image,
                        StudentAnswer = x.StudentAnswer,
                        Text = questionsById[x.QuestionId].Text,
                        Tolerance = x.Tolerance,
                        Id = x.QuestionId
                    })
                    .ToList(),
                NumOfCorrect = submission.NumOfCorrect
            };

        return new QuizHidden()
        {
            Description = quiz.Description,
            NumOfQuestions = submission.QuestionSubmissions.Count,
            Title = quiz.Title,
            Id = quiz.Id,
            MultipleChoiceQuestions = submission
                .QuestionSubmissions.OfType<MultipleChoiceSubmission>()
                .Select(x => new MultipleChoiceWithStudentAnswer
                {
                    Choices = x.Choices,
                    Description = questionsById[x.QuestionId].Description,
                    Image = questionsById[x.QuestionId].Image,
                    Text = questionsById[x.QuestionId].Text,
                    StudentAnswer = x.StudentAnswer,
                    Id = x.QuestionId
                })
                .ToList(),
            ValueToleranceQuestions = submission
                .QuestionSubmissions.OfType<ValueToleranceSubmission>()
                .Select(x => new ValueToleranceWithStudentAnswer
                {
                    Description = questionsById[x.QuestionId].Description,
                    Image = questionsById[x.QuestionId].Image,
                    StudentAnswer = x.StudentAnswer,
                    Text = questionsById[x.QuestionId].Text,
                    Tolerance = x.Tolerance,
                    Id = x.QuestionId
                })
                .ToList(),
            PassCount = quiz.PassCount
        };
    }

    public async Task<ExamResult> QueryAsync(GetExamQuery query)
    {
        if (query.StudentId == null)
        {
            var dashboardExam =
                await _context
                    .Set<Exam>()
                    .Include(x => x.Questions.OrderBy(x => x.CreatedAt))
                    .FirstOrDefaultAsync(x => x.Id == query.Id && x.CourseId == query.CourseId)
                ?? throw new ApiException(ExamsErrors.NotFound);

            return new ExamDashboard
            {
                Id = dashboardExam.Id,
                Description = dashboardExam.Description,
                PassCount = dashboardExam.PassCount,
                ExpiryHours = dashboardExam.ExpiryHours,
                Price = dashboardExam.Price,
                Questions = dashboardExam.Questions,
                ResultType = dashboardExam.ResultType,
                RetakePrice = dashboardExam.RetakePrice,
                Title = dashboardExam.Title
            };
        }

        var course =
            await _context
                .Set<Course>()
                .Include(x => x.Exams.Where(x => x.Id == query.Id))
                .ThenInclude(x => x.ExamEnrollments.Where(x => x.StudentId == query.StudentId))
                .ThenInclude(x => x.Submission)
                .Include(x => x.Exams.Where(x => x.Id == query.Id))
                .ThenInclude(x => x.Questions.OrderBy(x => x.CreatedAt))
                .Include(x =>
                    x.CourseEnrollments.Where(x =>
                        x.StudentId == query.StudentId && x.ExpiresAt > DateTime.UtcNow
                    )
                )
                .FirstOrDefaultAsync(x => x.Id == query.CourseId)
            ?? throw new ApiException(CoursesErrors.NotFound);

        var exam =
            course.Exams.FirstOrDefault(x => x.Id == query.Id)
            ?? throw new ApiException(ExamsErrors.NotFound);

        if (exam.EnrolledStudents.FirstOrDefault(x => x.Id == query.StudentId) is null)
            return new ExamNotBought
            {
                Id = exam.Id,
                Description = exam.Description,
                PassCount = exam.PassCount,
                ExpiryHours = exam.ExpiryHours,
                Price = exam.Price,
                Title = exam.Title,
                NumOfQuestions = exam.Questions.Count
            };

        var enrollment = exam.ExamEnrollments.First(x => x.StudentId == query.StudentId);

        var submission = enrollment.Submission;

        if (submission == null)
            return new ExamNotAnswered
            {
                Id = exam.Id,
                Price = exam.Price,
                RetakePrice = exam.RetakePrice,
                Description = exam.Description,
                PassCount = exam.PassCount,
                ExpiresAt = enrollment.ExpiresAt,
                Title = exam.Title,
                MultipleChoiceQuestions = exam
                    .Questions.Where(x => x.Body is MultipleChoiceQuestion)
                    .Select(x => new MultipleChoiceNotAnswered
                    {
                        Choices = (x.Body as MultipleChoiceQuestion)!.Choices,
                        Description = x.Description,
                        Id = x.Id,
                        Text = x.Text,
                        Image = x.Image
                    })
                    .ToList(),
                ValueToleranceQuestions = exam
                    .Questions.Where(x => x.Body is ValueToleranceQuestion)
                    .Select(x => new ValueToleranceNotAnswered
                    {
                        Description = x.Description,
                        Id = x.Id,
                        Text = x.Text,
                        Image = x.Image,
                        Tolerance = (x.Body as ValueToleranceQuestion)!.Tolerance
                    })
                    .ToList()
            };

        var questionsById = exam.Questions.ToDictionary(x => x.Id, x => x);

        var studentQuestionsById = submission.QuestionSubmissions.ToDictionary(
            x => x.QuestionId,
            x => x
        );

        if (exam.ResultType == ResultType.ResultWithAnswer)
            return new ExamResultWithAnswer
            {
                Id = exam.Id,
                Description = exam.Description,
                PassCount = exam.PassCount,
                Title = exam.Title,
                NumOfQuestions = exam.Questions.Count,
                MultipleChoiceQuestions = exam
                    .Questions.Where(x => x.Body is MultipleChoiceQuestion)
                    .Select(x =>
                    {
                        var q = x.Body as MultipleChoiceQuestion;
                        studentQuestionsById.TryGetValue(x.Id, out var qs);
                        var s = qs as MultipleChoiceSubmission;

                        return new MultipleChoiceWithCorrectAnswer
                        {
                            Choices = q!.Choices,
                            StudentAnswer = s?.StudentAnswer ?? "",
                            CorrectAnswer = q.CorrectAnswer,
                            Description = x.Description,
                            Id = x.Id,
                            IsCorrect = qs?.IsCorrect ?? false,
                            Text = x.Text,
                            Image = x.Image
                        };
                    })
                    .ToList(),
                ValueToleranceQuestions = exam
                    .Questions.Where(x => x.Body is ValueToleranceQuestion)
                    .Select(x =>
                    {
                        var q = x.Body as ValueToleranceQuestion;
                        studentQuestionsById.TryGetValue(x.Id, out var qs);
                        var s = qs as ValueToleranceSubmission;
                        return new ValueToleranceWithCorrectAnswer
                        {
                            CorrectAnswer = q!.CorrectAnswer,
                            Description = x.Description,
                            Id = x.Id,
                            IsCorrect = qs?.IsCorrect ?? false,
                            StudentAnswer = s?.StudentAnswer ?? -1,
                            Text = x.Text,
                            Image = x.Image,
                            Tolerance = q!.Tolerance
                        };
                    })
                    .ToList(),
                NumOfCorrect = submission.NumOfCorrect,
                RetakePrice = exam.RetakePrice
            };

        if (exam.ResultType == ResultType.ResultOnly)
            return new ExamResultOnly
            {
                Id = exam.Id,
                Description = exam.Description,
                PassCount = exam.PassCount,
                Title = exam.Title,
                MultipleChoiceQuestions = exam
                    .Questions.Where(x => x.Body is MultipleChoiceQuestion)
                    .Select(x =>
                    {
                        var q = x.Body as MultipleChoiceQuestion;
                        studentQuestionsById.TryGetValue(x.Id, out var qs);
                        var s = qs as MultipleChoiceSubmission;
                        return new MultipleChoiceWithStudentAnswer
                        {
                            Choices = q!.Choices,
                            StudentAnswer = s?.StudentAnswer ?? "",
                            Description = x.Description,
                            Id = x.Id,
                            Text = x.Text,
                            Image = x.Image
                        };
                    })
                    .ToList(),
                ValueToleranceQuestions = exam
                    .Questions.Where(x => x.Body is ValueToleranceQuestion)
                    .Select(x =>
                    {
                        var q = x.Body as ValueToleranceQuestion;
                        studentQuestionsById.TryGetValue(x.Id, out var qs);
                        var s = qs as ValueToleranceSubmission;
                        return new ValueToleranceWithStudentAnswer
                        {
                            Description = x.Description,
                            Id = x.Id,
                            StudentAnswer = s?.StudentAnswer ?? -1,
                            Text = x.Text,
                            Image = x.Image,
                            Tolerance = q!.Tolerance
                        };
                    })
                    .ToList(),
                NumOfQuestions = submission.NumOfQuestions,
                NumOfCorrect = submission.NumOfCorrect,
                RetakePrice = exam.RetakePrice
            };

        return new ExamHidden
        {
            Description = exam.Description,
            Id = exam.Id,
            PassCount = exam.PassCount,
            Title = exam.Title,
            MultipleChoiceQuestions = submission
                .QuestionSubmissions.OfType<MultipleChoiceSubmission>()
                .Select(x => new MultipleChoiceWithStudentAnswer
                {
                    Choices = x.Choices,
                    Description = questionsById[x.QuestionId].Description,
                    Image = questionsById[x.QuestionId].Image,
                    Text = questionsById[x.QuestionId].Text,
                    StudentAnswer = x.StudentAnswer,
                    Id = x.QuestionId
                })
                .ToList(),
            ValueToleranceQuestions = submission
                .QuestionSubmissions.OfType<ValueToleranceSubmission>()
                .Select(x => new ValueToleranceWithStudentAnswer
                {
                    Description = questionsById[x.QuestionId].Description,
                    Image = questionsById[x.QuestionId].Image,
                    StudentAnswer = x.StudentAnswer,
                    Text = questionsById[x.QuestionId].Text,
                    Tolerance = x.Tolerance,
                    Id = x.QuestionId
                })
                .ToList(),
            NumOfQuestions = submission.NumOfQuestions
        };
    }

    public async Task<PageList<SingleExamStudent>> QueryAsync(GetExamStudentsQuery query)
    {
        var search = query.Search?.Trim().ToLower();

        var lecture =
            await _context.Set<Exam>().AsNoTracking().FirstOrDefaultAsync(x => x.Id == query.ExamId)
            ?? throw new ApiException(LecturesErrors.NotFound);

        var studentsQuery = _context
            .Set<Student>()
            .Include(x => x.Accounts)
            .Include(x => x.ExamEnrollments.Where(x => x.ExamId == query.ExamId).Take(1))
            .ThenInclude(x => x.Submission)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(search))
            studentsQuery = studentsQuery.Where(x =>
                x.FullName.ToLower().Contains(search)
                || x.StudentCode.ToLower().Contains(search)
                || x.Accounts.First().Email.ToLower().Contains(search)
            );

        var students = await PageList<Student>.CreateAsync(
            studentsQuery,
            query.Page,
            query.PageSize
        );

        List<SingleExamStudent> result = new();

        foreach (var student in students.Items)
        {
            var enrollment = student.ExamEnrollments.SingleOrDefault();

            ExamState state;

            if (enrollment == null)
            {
                state = ExamState.NotEnrolled;
            }
            else
            {
                if (enrollment.Submission == null)
                    state = ExamState.WaitingSubmission;
                else if (enrollment.Submission.IsPassed)
                    state = ExamState.Passed;
                else
                    state = ExamState.Failed;
            }

            result.Add(
                new SingleExamStudent
                {
                    Id = student.Id,
                    Email = student.Accounts.Single().Email,
                    FullName = student.FullName,
                    StudentCode = student.StudentCode,
                    StudentExamScore = enrollment?.Submission?.NumOfCorrect,
                    TotalExamScore = enrollment?.Submission?.NumOfQuestions,
                    State = state
                }
            );
        }

        return new PageList<SingleExamStudent>(
            result,
            students.Page,
            students.PageSize,
            students.TotalCount
        );
    }


    public async IAsyncEnumerable<IEnumerable<ExportSingleLectureStudentResult>> QueryAsync(
        ExportLectureStudentsQuery query
    )
    {
        var lecture =
            await _context
                .Set<Lecture>()
                .Include(x => x.Course)
                .Include(x => x.Lessons)
                .Include(x => x.Quizzes)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == query.LectureId && query.CourseId == x.CourseId)
            ?? throw new ApiException(LecturesErrors.NotFound);

        var chunkSize = 100;
        var totalRecords = await _context
            .Set<Student>()
            .CountAsync(x => x.Level == lecture.Course.Level);
        var chunks = (int)Math.Ceiling((double)totalRecords / chunkSize);

        var q = _context
            .Set<Student>()
            .Where(x => x.Level == lecture.Course.Level)
            .Include(x => x.Accounts)
            .Include(x => x.LectureHomeworks.Where(x => x.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureQuizzes.Where(x => x.LectureId == query.LectureId).Take(1))
            .Include(x => x.AttendedLessons.Where(x => x.LectureId == query.LectureId))
            .Include(x => x.LectureAttendances.Where(x => x.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureEnrollments.Where(x => x.LectureId == query.LectureId).Take(1))
            .Include(x => x.QuizSubmissions.Where(x => x.Quiz.LectureId == query.LectureId))
            .ThenInclude(x => x.Quiz)
            .OrderBy(x => x.Id)
            .AsNoTracking();

        for (var i = 0; i < chunks; i++)
        {
            var students = await q.Skip(i * chunkSize).Take(chunkSize).ToListAsync();

            List<ExportSingleLectureStudentResult> result = new();

            foreach (var student in students)
            {
                var attendance = student.LectureAttendances.SingleOrDefault();

                var enrollment = student.LectureEnrollments.SingleOrDefault(x =>
                    x.LectureId == query.LectureId
                );

                result.Add(
                    new ExportSingleLectureStudentResult
                    {
                        Id = student.Id,
                        Email = student.Accounts.Single().Email,
                        FullName = student.FullName,
                        StudentCode = student.StudentCode,
                        CourseTitle = lecture.Course.Title,
                        HomeworkScore = student.LectureHomeworks.SingleOrDefault()?.Score,
                        QuizScore = student.LectureQuizzes.SingleOrDefault()?.Score,
                        StudentQuizzesScore = student.QuizSubmissions.Sum(x => x.NumOfCorrect),
                        TotalQuizzesScore = student.QuizSubmissions.Sum(x => x.NumOfQuestions),
                        Attended =
                            attendance != null ? true : false,

                        Enrollment =
                            enrollment == null
                                ? Enrollment.NotEnrolled
                                : enrollment.ExpiresAt > DateTime.UtcNow
                                    ? Enrollment.Active
                                    : Enrollment.Expired
                    }
                );
            }

            yield return result;
        }
    }
}