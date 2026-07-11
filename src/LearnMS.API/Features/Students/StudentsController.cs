using System.Globalization;
using CsvHelper;
using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using LearnMS.API.Features.Students.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Students;

[Route("api/students")]
[Tags("Students")]
public sealed class StudentsController(IStudentsService studentsService, ICurrentUserService currentUserService)
    : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "GetAllStudents")]
    public async Task<ApiWrapper.Success<PageList<SingleStudent>>> Get(string search, int? page, int? pageSize,
        StudentLevel? level)
    {
        var result = await studentsService.QueryAsync(new GetStudentsQuery
        {
            Page = page,
            PageSize = pageSize,
            Search = search,
            Level = level
        });

        return new ApiWrapper.Success<PageList<SingleStudent>>
        {
            Data = result,
            Message = result.Items.Count() > 0 ? "Retrieved students successfully" : "No students found"
        };
    }

    [HttpDelete("{studentId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "DeleteStudent")]
    public async Task<ApiWrapper.Success<object?>> Delete(Guid studentId)
    {
        await studentsService.ExecuteAsync(new DeleteStudentCommand
        {
            Id = studentId
        });
        return new ApiWrapper.Success<object?>
        {
            Message = "Deleted all students"
        };
    }

    [HttpPost]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "CreateStudent")]
    public async Task<ApiWrapper.Success<object?>> Post([FromBody] CreateStudentRequest request)
    {
        await studentsService.ExecuteAsync(new CreateStudentCommand
        {
            Email = request.Email,
            Password = request.Password,
            FullName = request.FullName,
            Level = request.Level,
            ParentPhoneNumber = request.ParentPhoneNumber,
            StudentCode = request.StudentCode,
            PhoneNumber = request.PhoneNumber,
            School = request.School
        });

        return new ApiWrapper.Success<object?>
        {
            Message = "Create student successfully"
        };
    }

    [HttpPost("{studentId:guid}/credit")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "AddStudentCredit")]
    public async Task<ApiWrapper.Success<object?>> AddCredit([FromBody] AddStudentCreditRequest request, Guid studentId)
    {
        var currentUser = await currentUserService.GetUserAsync();

        await studentsService.ExecuteAsync(new AddStudentCreditCommand
        {
            Amount = request.Amount,
            Id = studentId,
            AssistantId = currentUser!.Role == UserRole.Assistant ? currentUser.Id : null
        });

        return new ApiWrapper.Success<object?>
        {
            Message = "Added credit successfully"
        };
    }

    [HttpGet("{studentId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "GetStudent")]
    public async Task<ApiWrapper.Success<GetStudentResponse>> Get(Guid studentId)
    {
        var result = await studentsService.QueryAsync(new GetStudentQuery
        {
            Id = studentId
        });
        return new ApiWrapper.Success<GetStudentResponse>
        {
            Data = new GetStudentResponse
            {
                Password = result.Password,
                Credit = result.Credit,
                Email = result.Email,
                FullName = result.FullName,
                Level = result.Level,
                ParentPhoneNumber = result.ParentPhoneNumber,
                StudentCode = result.StudentCode,
                PhoneNumber = result.PhoneNumber,
                ProfilePicture = result.ProfilePicture,
                SchoolName = result.SchoolName,
                Id = result.Id,
            }
        };
    }

    [HttpPatch("{studentId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "UpdateStudent")]
    public async Task<ApiWrapper.Success<object?>> Patch([FromBody] UpdateStudentRequest request, Guid studentId)
    {
        await studentsService.ExecuteAsync(new UpdateStudentCommand
        {
            Id = studentId,
            FullName = request.FullName,
            Level = request.Level,
            ParentPhoneNumber = request.ParentPhoneNumber,
            StudentCode = request.StudentCode,
            PhoneNumber = request.PhoneNumber,
            Password = request.Password,
            SchoolName = request.SchoolName
        });

        return new ApiWrapper.Success<object?>
        {
            Message = "Student updated successfully"
        };
    }

    [HttpPost("{studentId:guid}/unlink-device")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "UnlinkStudentDevice")]
    public async Task<ApiWrapper.Success<object?>> UnlinkDevice(Guid studentId)
    {
        await studentsService.ExecuteAsync(new UnlinkStudentDeviceCommand
        {
            StudentId = studentId
        });
        return new ApiWrapper.Success<object?>
        {
            Message = "Unlinked device successfully"
        };
    }



    [HttpGet("{studentId:guid}/lectures")]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "GetStudentLectures")]
    public async Task<ApiWrapper.Success<PageList<SingleStudentLecture>>> GetStudentLectures(Guid studentId,
        string? search, int page = 1, int pageSize = 10)
    {
        var result = await studentsService.QueryAsync(new GetStudentLecturesQuery
        {
            StudentId = studentId,
            Search = search,
            Page = page,
            PageSize = pageSize
        });

        return new ApiWrapper.Success<PageList<SingleStudentLecture>>
        {
            Data = result
        };
    }

    [HttpGet("{studentId:guid}/exams")]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "GetStudentExams")]
    public async Task<ApiWrapper.Success<PageList<SingleStudentExam>>> GetStudentExams(Guid studentId, string? search,
        int page = 1, int pageSize = 10)
    {
        var result = await studentsService.QueryAsync(new GetStudentExamsQuery
        {
            StudentId = studentId,
            Search = search,
            Page = page,
            PageSize = pageSize
        });

        return new ApiWrapper.Success<PageList<SingleStudentExam>>
        {
            Data = result
        };
    }

    [HttpGet("export")]
    [SwaggerOperation(OperationId = "ExportStudents")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    public async Task<IActionResult> ExportStudents(StudentLevel? level)
    {
        var data = studentsService.QueryAsync(new ExportStudentsQuery
        {
            Level = level
        });

        Response.Headers.Append("Content-Type", "text/csv");
        Response.Headers.Append("Content-Disposition", "attachment; filename=students.csv");

        await using var sw = new StreamWriter(Response.Body);
        await using var csv = new CsvWriter(sw, CultureInfo.InvariantCulture);

        await foreach (var records in data)
        {
            await csv.WriteRecordsAsync(records);
            await csv.FlushAsync();
            await sw.FlushAsync();
        }

        return new EmptyResult();
    }

    [HttpGet("{studentId:guid}/events")]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "GetStudentEvents")]
    public async Task<ApiWrapper.Success<PageList<SingleStudentEvent>>> GetStudentEvents(Guid studentId,
        string? search, int page = 1, int pageSize = 10)
    {
        var user = HttpContext.CurrentUser()!;

        if (user.Role == UserRole.Student && user.Id != studentId)
        {
            throw new ApiException(AuthErrors.Forbidden);
        }


        var result = await studentsService.QueryAsync(new GetStudentEventsQuery()
        {
            StudentId = studentId,
            Search = search,
            Page = page,
            PageSize = pageSize
        });

        return new ApiWrapper.Success<PageList<SingleStudentEvent>>()
        {
            Data = result
        };
    }
}