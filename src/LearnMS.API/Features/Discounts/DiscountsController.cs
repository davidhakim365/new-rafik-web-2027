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
