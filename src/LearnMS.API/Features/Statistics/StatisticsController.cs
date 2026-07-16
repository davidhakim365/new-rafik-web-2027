using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Statistics.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Statistics;

[ApiController]
[Route("api/statistics")]
[Tags("Statistics")]
public class StatisticsController(AppDbContext context) : ControllerBase
{
    [HttpGet("incomes")]
    [SwaggerOperation(OperationId = "GetIncomesStatistics")]
    public async Task<ApiWrapper.Success<GetIncomesStatisticsResponse>> GetIncomesStatistics(
        [FromQuery] GetIncomeStatisticsQuery query)
    {
        var studentsCount = await GetTotalStudents();
        var totalOfflineIncome = await GetTotalOfflineIncomeAsync(query);
        var totalOnlineIncome = await GetTotalOnlineIncomeAsync(query);

        return new ApiWrapper.Success<GetIncomesStatisticsResponse>()
        {
            Data = new GetIncomesStatisticsResponse(
                studentsCount,
                (long)totalOnlineIncome,
                totalOfflineIncome)
        };
    }

    [HttpGet("courses")]
    [SwaggerOperation(OperationId = "GetCourseStatistics")]
    public async Task<ApiWrapper.Success<GetCourseStatisticsResponse>> GetCourseStatistics(
        [FromQuery] GetCourseStatisticsQuery query, Guid courseId)
    {
        List<LectureStudents> onlineStudents = await GetOnlineStudentsAsync(query, courseId);
        List<LectureStudents> attendedStudents = await GetAttendedStudentsAsync(query, courseId);
        List<LectureStudents> totalStudents = onlineStudents
            .Union(attendedStudents)
            .GroupBy(x => x.LectureName)
            .Select(x => new LectureStudents(x.Key, x.Sum(s => s.StudentCount)))
            .ToList();

        List<LectureAverageScore> averageQuizzes = await GetAverageQuizzesAsync(query, courseId);
        List<LectureAverageScore> averageHomeworks = await GetAverageHomeworksAsync(query, courseId);

        return new ApiWrapper.Success<GetCourseStatisticsResponse>()
        {
            Data = new GetCourseStatisticsResponse(totalStudents,
                onlineStudents,
                attendedStudents,
                averageHomeworks,
                averageQuizzes)
        };
    }

    [HttpGet("lecture")]
    [SwaggerOperation(OperationId = "GetLectureStatistics")]
    public async Task<ApiWrapper.Success<GetLectureStatisticsResponse>> GetLectureStatistics(
        Guid lectureId,
        [FromQuery] GetLectureStatisticsQuery query)
    {
        decimal averageQuizzes = await GetLectureAverageQuizzesAsync(lectureId);
        decimal averageHomeworks = await GetLectureAverageHomeworksAsync(lectureId);
        long totalAttended = await GetLectureTotalAttendedStudentsAsync(lectureId, query);
        long totalEnrolled = await GetLectureTotalEnrolledStudentsAsync(lectureId);

        long totalOfflineIncome = await GetTotalLectureOfflineIncomeAsync(lectureId, query);
        long totalOnlineIncome = await GetTotalLectureOnlineIncomeAsync(lectureId, query);

        return new ApiWrapper.Success<GetLectureStatisticsResponse>()
        {
            Data = new GetLectureStatisticsResponse(totalEnrolled,
                totalAttended,
                averageHomeworks,
                averageQuizzes, totalOnlineIncome, totalOfflineIncome)
        };
    }

    [AllowAnonymous]
    [HttpGet("latest-lectures", Name = "GetLatestLectures")]
    [SwaggerOperation(OperationId = "GetLatestLectures")]
    public async Task<ApiWrapper.Success<List<LectureItem>>> GetLatestLectures(Guid? courseId,
        StudentLevel? studentLevel)
    {
        var lastMonth = DateTime.UtcNow.AddMonths(-1);

        var result = await context
            .Lectures
            .Where(l => l.IsPublished && l.Course.IsPublished && l.CreatedAt >= lastMonth &&
                        (courseId == null || l.CourseId == courseId) &&
                        (studentLevel == null || l.Course.Level == studentLevel))
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new LectureItem(l.Id, l.CourseId, l.Title, l.Course.Title, l.ImageUrl,
                l.Lessons.Count,
                l.Quizzes.Count,
                l.EnrolledStudents.Count
            )).ToListAsync();

        return new ApiWrapper.Success<List<LectureItem>>()
        {
            Data = result
        };
    }

    [AllowAnonymous]
    [HttpGet("important-lectures", Name = "GetImportantLectures")]
    [SwaggerOperation(OperationId = "GetImportantLectures")]
    public async Task<ApiWrapper.Success<List<LectureItem>>> GetImportantLectures()
    {
        var result = await context
            .Lectures
            .Where(l => l.IsPublished && l.Course.IsPublished && l.IsImportant)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new LectureItem(l.Id, l.CourseId, l.Title, l.Course.Title, l.ImageUrl,
                l.Lessons.Count,
                l.Quizzes.Count,
                l.EnrolledStudents.Count
            )).ToListAsync();

        return new ApiWrapper.Success<List<LectureItem>>()
        {
            Data = result
        };
    }


    private async Task<long> GetTotalLectureOfflineIncomeAsync(Guid lectureId, GetLectureStatisticsQuery query)
    {
        var totalLectureEnrollments = context.Set<LectureAttendance>()
            .Where(e => e.LectureId == lectureId && e.AttendedAt != null)
            .AsQueryable();

        if (query.StartDate != null)
        {
            totalLectureEnrollments = totalLectureEnrollments.Where(x => x.AttendedAt >= query.StartDate!);
        }

        if (query.EndDate != null)
        {
            totalLectureEnrollments = totalLectureEnrollments.Where(x => x.AttendedAt <= query.EndDate!);
        }

        if (query.CenterId != null)
        {
            totalLectureEnrollments = totalLectureEnrollments.Where(x => x.CenterId == query.CenterId);
        }

        return await totalLectureEnrollments.CountAsync();
    }

    private async Task<long> GetTotalLectureOnlineIncomeAsync(Guid lectureId, GetLectureStatisticsQuery query)
    {
        var totalLectureEnrollments = context.Set<LectureEnrollment>()
            .Where(e => e.LectureId == lectureId)
            .AsQueryable();

        if (query.StartDate != null)
        {
            totalLectureEnrollments = totalLectureEnrollments.Where(x => x.EnrolledAt >= query.StartDate!);
        }

        if (query.EndDate != null)
        {
            totalLectureEnrollments = totalLectureEnrollments.Where(x => x.EnrolledAt <= query.EndDate!);
        }

        return await totalLectureEnrollments.CountAsync();
    }

    private async Task<long> GetLectureTotalEnrolledStudentsAsync(Guid lectureId)
    {
        var lectureEnrollmentQuery = context.Set<LectureEnrollment>()
            .Where(e => e.LectureId == lectureId)
            .GroupBy(le => le.StudentId)
            .Select(le => le.Key)
            .AsQueryable();

        var courseEnrollmentQuery = context.Set<CourseEnrollment>()
            .Where(e => e.CourseId == context.Lectures.Single(l => l.Id == lectureId).CourseId)
            .GroupBy(le => le.StudentId, le => le.StudentId)
            .Select(le => le.Key)
            .AsQueryable();

        return await lectureEnrollmentQuery.Union(courseEnrollmentQuery).Distinct().CountAsync();
    }

    private async Task<long> GetLectureTotalAttendedStudentsAsync(Guid lectureId, GetLectureStatisticsQuery query)
    {
        var totalStudentsQuery = context.Set<LectureAttendance>()
            .Where(e => e.LectureId == lectureId && e.AttendedAt != null)
            .AsQueryable();

        if (query.StartDate != null)
        {
            totalStudentsQuery = totalStudentsQuery.Where(x => x.AttendedAt >= query.StartDate!);
        }

        if (query.EndDate != null)
        {
            totalStudentsQuery = totalStudentsQuery.Where(x => x.AttendedAt <= query.EndDate!);
        }

        if (query.CenterId != null)
        {
            totalStudentsQuery = totalStudentsQuery.Where(x => x.CenterId == query.CenterId);
        }

        return await totalStudentsQuery.CountAsync();
    }

    private async Task<decimal> GetLectureAverageHomeworksAsync(Guid lectureId)
    {
        var totalStudentsQuery = context.Set<LectureHomework>()
            .Where(e => e.LectureId == lectureId)
            .AsQueryable();

        return await totalStudentsQuery.AverageAsync(q => (decimal?)q.Score) ?? 0;
    }

    private async Task<decimal> GetLectureAverageQuizzesAsync(Guid lectureId)
    {
        var totalStudentsQuery = context.Set<LectureQuiz>()
            .Where(e => e.LectureId == lectureId)
            .AsQueryable();

        var result = await totalStudentsQuery.AverageAsync(q => (int?)q.Score) ?? 0;

        return (decimal)result;
    }

    private Task<List<LectureAverageScore>> GetAverageHomeworksAsync(GetCourseStatisticsQuery query,
        Guid courseId)
    {
        var totalStudentsQuery = context.Set<LectureHomework>()
            .Where(e => e.Lecture.CourseId == courseId)
            .AsQueryable();


        return totalStudentsQuery
            .GroupBy(x => x.Lecture.Title)
            .Select(x => new LectureAverageScore(x.Key, x.Any() ? x.Average(q => q.Score) : 0))
            .ToListAsync();
    }


    private Task<List<LectureStudents>> GetAttendedStudentsAsync(GetCourseStatisticsQuery query, Guid courseId)
    {
        var totalStudentsQuery = context.Set<LectureAttendance>()
            .Where(e => e.Lecture.CourseId == courseId && e.AttendedAt != null)
            .AsQueryable();

        return totalStudentsQuery
            .GroupBy(x => x.Lecture.Title)
            .Select(x => new LectureStudents(x.Key, x.Count()))
            .ToListAsync();
    }


    private Task<List<LectureStudents>> GetOnlineStudentsAsync(GetCourseStatisticsQuery query, Guid courseId)
    {
        var totalStudentsQuery = context.Set<LectureEnrollment>()
            .Where(e => e.Lecture.CourseId == courseId)
            .AsQueryable();

        return totalStudentsQuery
            .GroupBy(x => x.Lecture.Title)
            .Select(x => new LectureStudents(x.Key, x.Count()))
            .ToListAsync();
    }

    Task<List<LectureAverageScore>> GetAverageQuizzesAsync(GetCourseStatisticsQuery query, Guid courseId)
    {
        var totalStudentsQuery = context.Set<LectureQuiz>()
            .Where(e => e.Lecture.CourseId == courseId)
            .AsQueryable();

        return totalStudentsQuery
            .GroupBy(x => x.Lecture.Title)
            .Select(x => new LectureAverageScore(x.Key, x.Average(q => q.Score)))
            .ToListAsync();
    }


    private async Task<int> GetTotalOfflineIncomeAsync(GetIncomeStatisticsQuery query)
    {
        var totalLectureEnrollments = context.Set<LectureAttendance>()
            .Where(x => x.AttendedAt != null)
            .AsQueryable();

        if (query.StartDate != null)
        {
            totalLectureEnrollments = totalLectureEnrollments.Where(x => x.AttendedAt >= query.StartDate!);
        }

        if (query.EndDate != null)
        {
            totalLectureEnrollments = totalLectureEnrollments.Where(x => x.AttendedAt <= query.EndDate!);
        }

        return await totalLectureEnrollments.CountAsync();
    }

    private async Task<long> GetTotalOnlineIncomeAsync(GetIncomeStatisticsQuery query)
    {
        var totalEnrollmentsQuery = context.Set<LectureEnrollment>()
            .AsQueryable();

        if (query.StartDate != null)
        {
            totalEnrollmentsQuery = totalEnrollmentsQuery.Where(x => x.EnrolledAt >= query.StartDate!);
        }

        if (query.EndDate != null)
        {
            totalEnrollmentsQuery = totalEnrollmentsQuery.Where(x => x.EnrolledAt <= query.EndDate!);
        }

        return await totalEnrollmentsQuery.CountAsync();
    }


    private Task<int> GetTotalStudents()
    {
        return context.Students.CountAsync();
    }
}