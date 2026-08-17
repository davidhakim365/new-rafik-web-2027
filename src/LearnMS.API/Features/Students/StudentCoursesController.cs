using System.ComponentModel.DataAnnotations;
using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Courses;
using LearnMS.API.Features.Students.Dtos;
using LearnMS.API.Security;
using LearnMS.API.ThirdParties.GoogleForms;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Students;

[Tags("Students")]
[Route("api/students/courses")]
public class StudentCoursesController(ICurrentUserService currentUserService, AppDbContext context) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(OperationId = nameof(GetStudentCourses))]
    public async Task<ApiWrapper.Success<List<StudentCourseDto>>> GetStudentCourses(
        [Required] StudentLevel level)
    {
        CurrentUser? user = await currentUserService.GetUserAsync();
        Guid? studentId = user == null
            ? null
            : await context.Students
                .AsNoTracking()
                .Where(s => s.Id == user.Id || s.Accounts.Any(a => a.Id == user.Id))
                .Select(s => (Guid?)s.Id)
                .FirstOrDefaultAsync();

        var result = await context.Courses
            .Where(c => c.Level == level && c.IsPublished)
            .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Description,
                    c.ImageUrl,
                    c.Price,
                    c.RenewalPrice,
                    c.Level,
                    LecturesCount = c.Lectures.Count(l => l.IsPublished),
                    c.ExpirationDays,
                    ExamsCount = c.Exams.Count,
                    ExpiresAt = studentId == null
                        ? null
                        : c.CourseEnrollments
                            .Where(es => es.StudentId == studentId)
                            .OrderByDescending(es => es.ExpiresAt)
                            .Select(es => (DateTime?)es.ExpiresAt)
                            .FirstOrDefault()
                }
            )
            .ToListAsync();

        List<StudentCourseDto> courses = result.Select(c => new StudentCourseDto(
            c.Id,
            c.Title,
            c.Description!,
            c.ImageUrl!,
            c.Price!.Value,
            c.RenewalPrice!.Value,
            c.Level!.Value,
            c.LecturesCount,
            c.ExamsCount,
            c.ExpirationDays,
            c.ExpiresAt
        )
        {
            Enrollment = EnrollmentStatus.FromExpiresAt(c.ExpiresAt)
        }).ToList();

        return new ApiWrapper.Success<List<StudentCourseDto>>()
        {
            Data = courses
        };
    }

    [HttpGet("{courseId:guid}")]
    [SwaggerOperation(OperationId = nameof(GetStudentCourseDetails))]
    public async Task<ApiWrapper.Success<StudentCourseDetailsDto>> GetStudentCourseDetails(
        Guid courseId)
    {
        CurrentUser? user = await currentUserService.GetUserAsync();

        var studentInfo = user == null
            ? null
            : await context.Students
                .AsNoTracking()
                .Where(s => s.Id == user.Id || s.Accounts.Any(a => a.Id == user.Id))
                .Select(s => new { s.Id, s.FullName, s.StudentCode })
                .FirstOrDefaultAsync();
        Guid? studentId = studentInfo?.Id;

        var course = await context.Courses
            .Where(c => c.IsPublished && c.Id == courseId)
            .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Description,
                    c.ImageUrl,
                    c.Price,
                    c.RenewalPrice,
                    c.Level,
                    c.ExpirationDays,
                    ExpiresAt = studentId == null
                        ? null
                        : c.CourseEnrollments
                            .Where(es => es.StudentId == studentId)
                            .OrderByDescending(es => es.ExpiresAt)
                            .Select(es => (DateTime?)es.ExpiresAt)
                            .FirstOrDefault(),
                    Lectures = c.Lectures
                        .Where(l => l.IsPublished)
                        .Select(l => new
                        {
                            l.Id,
                            l.Title,
                            l.Description,
                            l.Order,
                            l.ExpirationDays,
                            l.Price,
                            l.RenewalPrice,
                            l.ImageUrl,
                            l.HomeworkVideoUrl,
                            l.ChooseHomeworkFormUrl,
                            l.ChooseHomeworkStudentIdEntryId,
                            l.ChooseHomeworkNameEntryId,
                            ExpiresAt = studentId == null
                                ? null
                                : l.LectureEnrollments
                                    .Where(es => es.StudentId == studentId)
                                    .OrderByDescending(es => es.ExpiresAt)
                                    .Select(es => (DateTime?)es.ExpiresAt)
                                    .FirstOrDefault(),
                            Assets = l.Assets.Select(a => new StudentAssetDto()
                            {
                                Id = a.Id,
                                Name = a.Name,
                                Type = a.Type,
                                Url = a.Url
                            }).ToList(),
                            Lessons = l.Lessons
                                .Select(ls => new StudentLessonDto()
                                {
                                    Id = ls.Id,
                                    Title = ls.Title,
                                    Description = ls.Description,
                                    Order = ls.Order,
                                    RenewalPrice = ls.RenewalPrice
                                })
                                .ToList(),
                            Quizzes = l.Quizzes
                                .Select(q => new StudentQuizDto()
                                {
                                    Id = q.Id,
                                    Title = q.Title,
                                    Description = q.Description,
                                    Order = q.Order,
                                    QuestionsCount = q.Questions.Count,
                                    IsSubmitted = studentId != null && q.QuizSubmissions.Any(s => s.StudentId == studentId),
                                    NumOfCorrect = studentId == null
                                        ? null
                                        : q.QuizSubmissions
                                            .Where(s => s.StudentId == studentId)
                                            .Select(s => (int?)s.NumOfCorrect)
                                            .FirstOrDefault(),
                                    NumOfQuestions = studentId == null
                                        ? null
                                        : q.QuizSubmissions
                                            .Where(s => s.StudentId == studentId)
                                            .Select(s => (int?)s.NumOfQuestions)
                                            .FirstOrDefault(),
                                    PassCount = q.PassCount,
                                    IsPassed = studentId == null
                                        ? null
                                        : q.QuizSubmissions
                                            .Where(s => s.StudentId == studentId)
                                            .Select(s => (bool?)(s.NumOfCorrect >= q.PassCount))
                                            .FirstOrDefault(),
                                })
                                .ToList(),
                        }),
                    Exams = c.Exams
                        .Select(e => new StudentExamDto()
                        {
                            Id = e.Id,
                            Title = e.Title,
                            Description = e.Description,
                            Order = e.Order,
                            QuestionsCount = e.Questions.Count,
                            Price = e.Price,
                            RetakePrice = e.RetakePrice,
                            ExpiryHours = e.ExpiryHours,
                            IsPurchased = studentId != null && e.ExamEnrollments.Any(en => en.StudentId == studentId),
                            IsSubmitted = studentId != null && e.ExamEnrollments
                                .Any(en => en.StudentId == studentId && en.Submission != null),
                            ExpiresAt = studentId == null
                                ? null
                                : e.ExamEnrollments
                                    .Where(en => en.StudentId == studentId)
                                    .Select(en => (DateTime?)en.ExpiresAt)
                                    .FirstOrDefault(),
                        })
                        .ToList()
                }
            )
            .FirstOrDefaultAsync();

        if (course is null)
        {
            throw new ApiException(CoursesErrors.NotFound);
        }

        DateTime? courseExpires = course.ExpiresAt;

        List<StudentLectureDto> lectures = course.Lectures.Select(l =>
        {
            var expiresAt = EffectiveEnrollmentExpiresAt(courseExpires, l.ExpiresAt);
            return new StudentLectureDto()
            {
                Id = l.Id,
                Title = l.Title,
                Description = l.Description,
                Price = l.Price!.Value,
                RenewalPrice = l.RenewalPrice!.Value,
                Order = l.Order,
                ImageUrl = l.ImageUrl,
                HomeworkVideoUrl = l.HomeworkVideoUrl,
                ChooseHomeworkFormUrl = GoogleFontsPrefill.ApplyPrefill(
                    l.ChooseHomeworkFormUrl,
                    l.ChooseHomeworkStudentIdEntryId,
                    l.ChooseHomeworkNameEntryId,
                    studentInfo?.StudentCode,
                    studentInfo?.FullName
                ),
                Assets = l.Assets,
                ExpirationDays = l.ExpirationDays,
                Items = l.Lessons.Cast<StudentLectureItemDto>().Union(l.Quizzes).OrderBy(i => i.Order).ToList(),
                ExpiresAt = expiresAt,
                Enrollment = EnrollmentStatus.FromExpiresAt(expiresAt),
            };
        }).ToList();

        var courseDto = new StudentCourseDetailsDto()
        {
            Id = course.Id,
            Title = course.Title,
            Description = course.Description!,
            ImageUrl = course.ImageUrl!,
            Price = course.Price!.Value,
            RenewalPrice = course.RenewalPrice!.Value,
            Level = course.Level!.Value,
            ExpiresAt = courseExpires,
            Enrollment = EnrollmentStatus.FromExpiresAt(courseExpires),
            ExpirationDays = course.ExpirationDays,
            Items = lectures
                .Cast<StudentCourseItemDto>()
                .Union(course.Exams)
                .OrderBy(i => i.Order)
                .ToList(),
        };


        return new ApiWrapper.Success<StudentCourseDetailsDto>()
        {
            Data = courseDto,
        };
    }

    private static DateTime? EffectiveEnrollmentExpiresAt(DateTime? courseExpiresAt, DateTime? lectureExpiresAt)
    {
        if (courseExpiresAt is null) return lectureExpiresAt;
        if (lectureExpiresAt is null) return courseExpiresAt;
        return courseExpiresAt > lectureExpiresAt ? courseExpiresAt : lectureExpiresAt;
    }
}
