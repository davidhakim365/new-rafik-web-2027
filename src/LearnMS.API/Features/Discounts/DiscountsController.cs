using System.ComponentModel.DataAnnotations;
using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Discounts;

public sealed record StudentDiscountItem
{
    [Required] public required Guid Id { get; init; }
    [Required] public required Guid StudentId { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string StudentCode { get; init; }
    [Required] public required string PhoneNumber { get; init; }
    [Required] public required string Email { get; init; }
    [Required] public required StudentLevel Level { get; init; }
    [Required] public required decimal Percentage { get; init; }
    [Required] public required DiscountTarget AppliesTo { get; init; }
    [Required] public required DateTime CreatedAt { get; init; }
}

public sealed class AssignStudentDiscountsRequest
{
    [Required] public required List<Guid> StudentIds { get; set; }
    [Required] public required decimal Percentage { get; set; }
    [Required] public required DiscountTarget AppliesTo { get; set; }
}

public sealed class UpdateStudentDiscountRequest
{
    [Required] public required decimal Percentage { get; set; }
    [Required] public required DiscountTarget AppliesTo { get; set; }
}

public sealed record DiscountLectureOption
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string Title { get; init; }
    [Required] public required Guid CourseId { get; init; }
    [Required] public required string CourseTitle { get; init; }
    public StudentLevel? Level { get; init; }
    public decimal? Price { get; init; }
    public decimal? RenewalPrice { get; init; }
}

public sealed record LectureDiscountCandidate
{
    [Required] public required Guid StudentId { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string StudentCode { get; init; }
    [Required] public required string PhoneNumber { get; init; }
    [Required] public required string Email { get; init; }
    [Required] public required StudentLevel Level { get; init; }
    [Required] public required int AttendedCount { get; init; }
    [Required] public required int CourseLectureCount { get; init; }
    public Guid? DiscountId { get; init; }
    public decimal? Percentage { get; init; }
    public DiscountTarget? AppliesTo { get; init; }
}

public sealed record LectureStudentDiscountItem
{
    [Required] public required Guid Id { get; init; }
    [Required] public required Guid StudentId { get; init; }
    [Required] public required Guid LectureId { get; init; }
    [Required] public required string LectureTitle { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string StudentCode { get; init; }
    [Required] public required string PhoneNumber { get; init; }
    [Required] public required StudentLevel Level { get; init; }
    [Required] public required int AttendedCount { get; init; }
    [Required] public required decimal Percentage { get; init; }
    [Required] public required DiscountTarget AppliesTo { get; init; }
    [Required] public required DateTime CreatedAt { get; init; }
}

[Route("api/discounts")]
[Tags("Discounts")]
[ApiController]
[ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageDiscounts])]
public sealed class DiscountsController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(OperationId = "GetStudentDiscounts")]
    public async Task<ApiWrapper.Success<PageList<StudentDiscountItem>>> Get(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] string? search)
    {
        var pageNumber = page is null or < 1 ? 1 : page.Value;
        var size = pageSize is null or < 1 ? 10 : Math.Min(pageSize.Value, 100);

        var query = DiscountQuery();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x =>
                x.FullName.ToLower().Contains(term)
                || x.StudentCode.ToLower().Contains(term)
                || x.PhoneNumber.Contains(term)
                || x.Email.ToLower().Contains(term));
        }

        query = query.OrderByDescending(x => x.CreatedAt);

        var result = await PageList<StudentDiscountItem>.CreateAsync(query, pageNumber, size);

        return new ApiWrapper.Success<PageList<StudentDiscountItem>>
        {
            Data = result,
            Message = "successfully retrieved discounts"
        };
    }

    [HttpPost]
    [SwaggerOperation(OperationId = "AssignStudentDiscounts")]
    public async Task<ApiWrapper.Success<List<StudentDiscountItem>>> Assign(
        [FromBody] AssignStudentDiscountsRequest request)
    {
        EnsurePercentage(request.Percentage);

        var studentIds = request.StudentIds.Where(id => id != Guid.Empty).Distinct().ToList();
        if (studentIds.Count == 0)
            throw new ApiException(DiscountsErrors.NoStudents);

        var existingStudentIds = await context.Students
            .Where(s => studentIds.Contains(s.Id))
            .Select(s => s.Id)
            .ToListAsync();

        if (existingStudentIds.Count != studentIds.Count)
            throw new ApiException(DiscountsErrors.StudentNotFound);

        var discounts = await context.StudentDiscounts
            .Where(d => studentIds.Contains(d.StudentId))
            .ToListAsync();

        var byStudent = discounts.ToDictionary(d => d.StudentId);

        foreach (var studentId in studentIds)
        {
            if (byStudent.TryGetValue(studentId, out var discount))
            {
                discount.Percentage = request.Percentage;
                discount.AppliesTo = request.AppliesTo;
                continue;
            }

            context.StudentDiscounts.Add(new StudentDiscount
            {
                StudentId = studentId,
                Percentage = request.Percentage,
                AppliesTo = request.AppliesTo
            });
        }

        await context.SaveChangesAsync();

        var items = await DiscountQuery()
            .Where(x => studentIds.Contains(x.StudentId))
            .OrderBy(x => x.FullName)
            .ToListAsync();

        return new ApiWrapper.Success<List<StudentDiscountItem>>
        {
            Data = items,
            Message = "Discount saved for the selected students"
        };
    }

    [HttpPatch("{id:guid}")]
    [SwaggerOperation(OperationId = "UpdateStudentDiscount")]
    public async Task<ApiWrapper.Success<StudentDiscountItem>> Update(
        Guid id,
        [FromBody] UpdateStudentDiscountRequest request)
    {
        EnsurePercentage(request.Percentage);

        var discount = await context.StudentDiscounts.FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new ApiException(DiscountsErrors.NotFound);

        discount.Percentage = request.Percentage;
        discount.AppliesTo = request.AppliesTo;
        await context.SaveChangesAsync();

        var item = await DiscountQuery().FirstAsync(x => x.Id == id);

        return new ApiWrapper.Success<StudentDiscountItem>
        {
            Data = item,
            Message = "Discount updated"
        };
    }

    [HttpDelete("{id:guid}")]
    [SwaggerOperation(OperationId = "DeleteStudentDiscount")]
    public async Task<ApiWrapper.Success<Guid>> Delete(Guid id)
    {
        var discount = await context.StudentDiscounts.FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new ApiException(DiscountsErrors.NotFound);

        context.StudentDiscounts.Remove(discount);
        await context.SaveChangesAsync();

        return new ApiWrapper.Success<Guid>
        {
            Data = id,
            Message = "Discount removed"
        };
    }

    [HttpGet("lectures")]
    [SwaggerOperation(OperationId = "GetDiscountLectures")]
    public async Task<ApiWrapper.Success<List<DiscountLectureOption>>> GetLectures()
    {
        var lectures = await (
            from lecture in context.Lectures.AsNoTracking()
            join course in context.Courses.AsNoTracking() on lecture.CourseId equals course.Id
            orderby course.Title, lecture.Order
            select new DiscountLectureOption
            {
                Id = lecture.Id,
                Title = lecture.Title,
                CourseId = course.Id,
                CourseTitle = course.Title,
                Level = course.Level,
                Price = lecture.Price,
                RenewalPrice = lecture.RenewalPrice
            }).ToListAsync();

        return new ApiWrapper.Success<List<DiscountLectureOption>>
        {
            Data = lectures,
            Message = "successfully retrieved lectures"
        };
    }

    [HttpGet("lectures/{lectureId:guid}/students")]
    [SwaggerOperation(OperationId = "GetLectureDiscountCandidates")]
    public async Task<ApiWrapper.Success<PageList<LectureDiscountCandidate>>> GetCandidates(
        Guid lectureId,
        [FromQuery] int? minAttendance,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] string? search)
    {
        var pageNumber = page is null or < 1 ? 1 : page.Value;
        var size = pageSize is null or < 1 ? 20 : Math.Min(pageSize.Value, 100);
        var minimum = minAttendance is null or < 0 ? 0 : minAttendance.Value;

        var result = await CandidateQuery(lectureId, minimum, search, pageNumber, size);

        return new ApiWrapper.Success<PageList<LectureDiscountCandidate>>
        {
            Data = result,
            Message = "successfully retrieved students"
        };
    }

    [HttpGet("lectures/{lectureId:guid}")]
    [SwaggerOperation(OperationId = "GetLectureStudentDiscounts")]
    public async Task<ApiWrapper.Success<PageList<LectureStudentDiscountItem>>> GetLectureDiscounts(
        Guid lectureId,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] string? search)
    {
        _ = await LectureCourseAsync(lectureId);

        var pageNumber = page is null or < 1 ? 1 : page.Value;
        var size = pageSize is null or < 1 ? 10 : Math.Min(pageSize.Value, 100);
        var query = LectureDiscountQuery(lectureId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x =>
                x.FullName.ToLower().Contains(term)
                || x.StudentCode.ToLower().Contains(term)
                || x.PhoneNumber.Contains(term));
        }

        query = query.OrderByDescending(x => x.CreatedAt);
        var result = await PageList<LectureStudentDiscountItem>.CreateAsync(query, pageNumber, size);

        return new ApiWrapper.Success<PageList<LectureStudentDiscountItem>>
        {
            Data = result,
            Message = "successfully retrieved lecture discounts"
        };
    }

    [HttpPost("lectures/{lectureId:guid}")]
    [SwaggerOperation(OperationId = "AssignLectureStudentDiscounts")]
    public async Task<ApiWrapper.Success<List<LectureStudentDiscountItem>>> AssignLecture(
        Guid lectureId,
        [FromBody] AssignStudentDiscountsRequest request)
    {
        EnsurePercentage(request.Percentage);
        var lecture = await LectureCourseAsync(lectureId);

        var studentIds = request.StudentIds.Where(id => id != Guid.Empty).Distinct().ToList();
        if (studentIds.Count == 0)
            throw new ApiException(DiscountsErrors.NoStudents);

        var students = await context.Students
            .Where(s => studentIds.Contains(s.Id))
            .Select(s => new { s.Id, s.Level })
            .ToListAsync();

        if (students.Count != studentIds.Count || students.Any(s => s.Level != lecture.Level))
            throw new ApiException(DiscountsErrors.StudentNotFound);

        var existing = await context.LectureStudentDiscounts
            .Where(d => d.LectureId == lectureId && studentIds.Contains(d.StudentId))
            .ToListAsync();
        var byStudent = existing.ToDictionary(d => d.StudentId);

        foreach (var studentId in studentIds)
        {
            if (byStudent.TryGetValue(studentId, out var discount))
            {
                discount.Percentage = request.Percentage;
                discount.AppliesTo = request.AppliesTo;
                continue;
            }

            context.LectureStudentDiscounts.Add(new LectureStudentDiscount
            {
                StudentId = studentId,
                LectureId = lectureId,
                Percentage = request.Percentage,
                AppliesTo = request.AppliesTo
            });
        }

        await context.SaveChangesAsync();

        var items = await LectureDiscountQuery(lectureId)
            .Where(x => studentIds.Contains(x.StudentId))
            .OrderBy(x => x.FullName)
            .ToListAsync();

        return new ApiWrapper.Success<List<LectureStudentDiscountItem>>
        {
            Data = items,
            Message = "Lecture discount saved for the selected students"
        };
    }

    [HttpPatch("lecture-discounts/{id:guid}")]
    [SwaggerOperation(OperationId = "UpdateLectureStudentDiscount")]
    public async Task<ApiWrapper.Success<LectureStudentDiscountItem>> UpdateLecture(
        Guid id,
        [FromBody] UpdateStudentDiscountRequest request)
    {
        EnsurePercentage(request.Percentage);

        var discount = await context.LectureStudentDiscounts.FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new ApiException(DiscountsErrors.NotFound);

        discount.Percentage = request.Percentage;
        discount.AppliesTo = request.AppliesTo;
        await context.SaveChangesAsync();

        var item = await LectureDiscountQuery(discount.LectureId).FirstAsync(x => x.Id == id);

        return new ApiWrapper.Success<LectureStudentDiscountItem>
        {
            Data = item,
            Message = "Lecture discount updated"
        };
    }

    [HttpDelete("lecture-discounts/{id:guid}")]
    [SwaggerOperation(OperationId = "DeleteLectureStudentDiscount")]
    public async Task<ApiWrapper.Success<Guid>> DeleteLecture(Guid id)
    {
        var discount = await context.LectureStudentDiscounts.FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new ApiException(DiscountsErrors.NotFound);

        context.LectureStudentDiscounts.Remove(discount);
        await context.SaveChangesAsync();

        return new ApiWrapper.Success<Guid>
        {
            Data = id,
            Message = "Lecture discount removed"
        };
    }

    private async Task<(Guid CourseId, StudentLevel? Level)> LectureCourseAsync(Guid lectureId)
    {
        var lecture = await context.Lectures
            .AsNoTracking()
            .Where(l => l.Id == lectureId)
            .Select(l => new { l.CourseId, l.Course.Level })
            .FirstOrDefaultAsync()
            ?? throw new ApiException(DiscountsErrors.LectureNotFound);

        return (lecture.CourseId, lecture.Level);
    }

    private async Task<PageList<LectureDiscountCandidate>> CandidateQuery(
        Guid lectureId,
        int minAttendance,
        string? search,
        int page,
        int pageSize)
    {
        var lecture = await LectureCourseAsync(lectureId);
        if (lecture.Level is not StudentLevel level)
            throw new ApiException(DiscountsErrors.LectureNotFound);

        var otherLectureCount = await context.Lectures
            .CountAsync(l => l.CourseId == lecture.CourseId && l.Id != lectureId);

        var query =
            from student in context.Students.AsNoTracking()
            join account in context.Accounts.AsNoTracking() on student.Id equals account.Id
            where student.Level == level
            select new LectureDiscountCandidate
            {
                StudentId = student.Id,
                FullName = student.FullName,
                StudentCode = student.StudentCode,
                PhoneNumber = student.PhoneNumber,
                Email = account.Email,
                Level = student.Level,
                AttendedCount = context.Set<LectureAttendance>().Count(a =>
                    a.StudentId == student.Id
                    && a.AttendedAt != null
                    && a.Lecture.CourseId == lecture.CourseId
                    && a.LectureId != lectureId),
                CourseLectureCount = otherLectureCount,
                DiscountId = context.LectureStudentDiscounts
                    .Where(d => d.StudentId == student.Id && d.LectureId == lectureId)
                    .Select(d => (Guid?)d.Id)
                    .FirstOrDefault(),
                Percentage = context.LectureStudentDiscounts
                    .Where(d => d.StudentId == student.Id && d.LectureId == lectureId)
                    .Select(d => (decimal?)d.Percentage)
                    .FirstOrDefault(),
                AppliesTo = context.LectureStudentDiscounts
                    .Where(d => d.StudentId == student.Id && d.LectureId == lectureId)
                    .Select(d => (DiscountTarget?)d.AppliesTo)
                    .FirstOrDefault()
            };

        if (minAttendance > 0)
            query = query.Where(x => x.AttendedCount >= minAttendance);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x =>
                x.FullName.ToLower().Contains(term)
                || x.StudentCode.ToLower().Contains(term)
                || x.PhoneNumber.Contains(term)
                || x.Email.ToLower().Contains(term));
        }

        query = query.OrderByDescending(x => x.AttendedCount).ThenBy(x => x.FullName);
        return await PageList<LectureDiscountCandidate>.CreateAsync(query, page, pageSize);
    }

    private IQueryable<LectureStudentDiscountItem> LectureDiscountQuery(Guid lectureId)
    {
        return
            from discount in context.LectureStudentDiscounts.AsNoTracking()
            join student in context.Students.AsNoTracking() on discount.StudentId equals student.Id
            join lecture in context.Lectures.AsNoTracking() on discount.LectureId equals lecture.Id
            where discount.LectureId == lectureId
            select new LectureStudentDiscountItem
            {
                Id = discount.Id,
                StudentId = student.Id,
                LectureId = lecture.Id,
                LectureTitle = lecture.Title,
                FullName = student.FullName,
                StudentCode = student.StudentCode,
                PhoneNumber = student.PhoneNumber,
                Level = student.Level,
                AttendedCount = context.Set<LectureAttendance>().Count(a =>
                    a.StudentId == student.Id
                    && a.AttendedAt != null
                    && a.Lecture.CourseId == lecture.CourseId
                    && a.LectureId != lectureId),
                Percentage = discount.Percentage,
                AppliesTo = discount.AppliesTo,
                CreatedAt = discount.CreatedAt
            };
    }

    private IQueryable<StudentDiscountItem> DiscountQuery()
    {
        return
            from discount in context.StudentDiscounts.AsNoTracking()
            join student in context.Students.AsNoTracking() on discount.StudentId equals student.Id
            join account in context.Accounts.AsNoTracking() on student.Id equals account.Id
            select new StudentDiscountItem
            {
                Id = discount.Id,
                StudentId = student.Id,
                FullName = student.FullName,
                StudentCode = student.StudentCode,
                PhoneNumber = student.PhoneNumber,
                Email = account.Email,
                Level = student.Level,
                Percentage = discount.Percentage,
                AppliesTo = discount.AppliesTo,
                CreatedAt = discount.CreatedAt
            };
    }

    private static void EnsurePercentage(decimal percentage)
    {
        if (percentage <= 0 || percentage > 100)
            throw new ApiException(DiscountsErrors.InvalidPercentage);
    }
}
