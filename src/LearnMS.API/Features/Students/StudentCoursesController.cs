using System.ComponentModel.DataAnnotations;
using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Courses;
using LearnMS.API.Features.Students.Dtos;
using LearnMS.API.Security;
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
                    Enrollment = user == null
                        ? null
                        : c.CourseEnrollments.OrderByDescending(es => es.ExpiresAt)
                            .Take(1)
                            .FirstOrDefault(es =>
                                es.StudentId == user.Id)
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
            c.Enrollment?.ExpiresAt
        )).ToList();

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
                    Enrollment = user == null
                        ? null
                        : c.CourseEnrollments
                            .OrderByDescending(es => es.ExpiresAt)
                            .Take(1)
                            .FirstOrDefault(es =>
                                es.StudentId == user.Id),
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
                            Enrollment = user == null
                                ? null
                                : l.LectureEnrollments
                                    .OrderByDescending(es => es.ExpiresAt)
                                    .Take(1)
                                    .FirstOrDefault(es =>
                                        es.StudentId == user.Id),
                            Assets = l.Assets.Select(a => new StudentAssetDto()
                            {
                                Id = a.Id,
                                Name = a.Name,
                                Type = a.Type
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
                            ExpiryHours = e.ExpiryHours
                        })
                        .ToList()
                }
            )
            .FirstOrDefaultAsync();

        if (course is null)
        {
            throw new ApiException(CoursesErrors.NotFound);
        }

        DateTime? courseExpires = course.Enrollment?.ExpiresAt;

        List<StudentLectureDto> lectures = course.Lectures.Select(l => new StudentLectureDto()
        {
            Id = l.Id,
            Title = l.Title,
            Description = l.Description,
            Price = l.Price!.Value,
            RenewalPrice = l.RenewalPrice!.Value,
            Order = l.Order,
            Assets = l.Assets,
            ExpirationDays = l.ExpirationDays,
            Items = l.Lessons.Cast<StudentLectureItemDto>().Union(l.Quizzes).OrderBy(i => i.Order).ToList(),
            ExpiresAt = courseExpires ?? l.Enrollment?.ExpiresAt,
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
            ExpiresAt = course.Enrollment?.ExpiresAt,
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
}