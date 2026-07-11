using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Courses.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Courses;

[Route("api/courses")]
[Tags("Courses")]
public sealed class CoursesController : ControllerBase
{
    ICoursesService _coursesService;
    ICurrentUserService _currentUserService;

    public CoursesController(ICoursesService coursesService, ICurrentUserService currentUserService)
    {
        _coursesService = coursesService;
        _currentUserService = currentUserService;
    }

    [HttpPost("{courseId:guid}/buy")]
    [ApiAuthorize(Role = UserRole.Student)]
    [SwaggerOperation(OperationId = "BuyCourse")]
    public async Task<ApiWrapper.Success<object?>> Buy(Guid courseId)
    {
        var currentUser = await _currentUserService.GetUserAsync();

        await _coursesService.ExecuteAsync(new BuyCourseCommand
        {
            CourseId = courseId,
            StudentId = currentUser!.Id
        });

        return new()
        {
            Message = "Course purchased successfully"
        };
    }

    [HttpDelete("{courseId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "DeleteCourse")]
    public async Task<ApiWrapper.Success<object?>> Delete(Guid courseId)
    {
        await _coursesService.ExecuteAsync(new DeleteCourseCommand
        {
            Id = courseId
        });
        return new()
        {
            Message = "Course deleted successfully"
        };
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiWrapper.Success<GetCoursesResult>), 200)]
    [ProducesResponseType(typeof(ApiWrapper.Success<GetStudentCoursesResult>), 200)]
    [SwaggerOperation(OperationId = "GetAllCourses")]
    public async Task<ApiWrapper.Success<object>> Get()
    {
        var currentUser = await _currentUserService.GetUserAsync();

        object response;

        int count = 0;

        if (currentUser is null)
        {
            var result = await _coursesService.QueryAsync(new GetCoursesQuery { IsPublished = true });
            response = result; 
            count = result.Items.Count();
        }
        else if (currentUser.Role == UserRole.Student)
        {

            var result = await _coursesService.QueryAsync(new GetStudentCoursesQuery(currentUser.Id));

            response = result;
            count = result.Items.Count();
        }
        else
        {
            var result = await _coursesService.QueryAsync(new GetCoursesQuery { });

            response = result;
            count = result.Items.Count();
        }


        return new()
        {
            Data = response,
            Message = count == 0 ? "No courses found" : "Courses retrieved successfully"
        };
    }

    [HttpGet("{courseId:guid}")]
    [SwaggerOperation(OperationId = "GetCourse")]
    public async Task<ApiWrapper.Success<GetCourseResult>> Get(Guid courseId)
    {
        var currentUser = await _currentUserService.GetUserAsync();

        GetCourseResult result;

        if (currentUser is null)
        {
            result = await _coursesService.QueryAsync(new GetCourseQuery { Id = courseId, IsCourseItemPublished = true });
        }
        else if (currentUser.Role == UserRole.Student)
        {

            result = await _coursesService.QueryAsync(new GetStudentCourseQuery { Id = courseId, IsCourseItemPublished = true, StudentId = currentUser.Id });
        }
        else
        {

            result = await _coursesService.QueryAsync(new GetCourseQuery { Id = courseId });
        }


        return new()
        {
            Data = result,
        };
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ApiAuthorize(Permissions = [Permission.ManageCourses])]

    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "CreateCourse")]
    public async Task<ApiWrapper.Success<CreateCourseResult>> Post([FromBody] CreateCourseCommand request)
    {
        CreateCourseResult result = await _coursesService.ExecuteAsync(request);

        Response.StatusCode = StatusCodes.Status201Created;

        return new()
        {
            Message = "Course created successfully",
            Data = result,
        };
    }

    [HttpPatch("{courseId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "UpdateCourse")]
    public async Task<ApiWrapper.Success<object?>> Patch([FromForm] UpdateCourseRequest request, Guid courseId)
    {
        await _coursesService.ExecuteAsync(new UpdateCourseCommand
        {
            ImageUrl = request.ImageUrl,
            Id = courseId,
            Title = request.Title,
            Description = request.Description,
            Level = request.Level,
            Price = request.Price,
            RenewalPrice = request.RenewalPrice,
            ExpirationDays = request.ExpirationDays
        });

        Response.StatusCode = StatusCodes.Status200OK;

        return new()
        {
            Message = "Course created successfully"
        };
    }

    [HttpPost("{courseId:guid}/publish")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "PublishCourse")]
    public async Task<ApiWrapper.Success<object?>> Publish(Guid courseId)
    {
        await _coursesService.ExecuteAsync(new PublishCourseCommand
        {
            Id = courseId
        });
        return new()
        {
            Message = "Course created successfully"
        };
    }


    [HttpPost("{courseId:guid}/unpublish")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "UnpublishCourse")]
    public async Task<ApiWrapper.Success<object?>> Unpublish(Guid courseId)
    {
        await _coursesService.ExecuteAsync(new UnPublishCourseCommand
        {
            Id = courseId
        });
        return new()
        {
            Message = "Course created successfully"
        };
    }
}