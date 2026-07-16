using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Centers.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Centers;

[Route("api/centers")]
[Tags("Centers")]
public sealed class CentersController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "GetCenters")]
    public async Task<ApiWrapper.Success<List<CenterDto>>> GetCenters()
    {
        var centers = await context.Set<Center>()
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CenterDto
            {
                Id = c.Id,
                Name = c.Name,
                IsActive = c.IsActive
            })
            .ToListAsync();

        return new ApiWrapper.Success<List<CenterDto>> { Data = centers };
    }

    [HttpPost]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "CreateCenter")]
    public async Task<ApiWrapper.Success<CenterDto>> CreateCenter([FromBody] CreateCenterRequest request)
    {
        var normalizedName = request.Name.Trim();
        var exists = await context.Set<Center>()
            .AnyAsync(c => c.Name.ToLower() == normalizedName.ToLower());

        if (exists)
            throw new ApiException(CentersErrors.NameAlreadyExists);

        var center = new Center
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        context.Add(center);
        await context.SaveChangesAsync();

        return new ApiWrapper.Success<CenterDto>
        {
            Data = new CenterDto
            {
                Id = center.Id,
                Name = center.Name,
                IsActive = center.IsActive
            },
            Message = "Center created successfully"
        };
    }
}
