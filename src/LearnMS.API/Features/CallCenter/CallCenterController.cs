using System.Globalization;
using CsvHelper;
using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using LearnMS.API.Features.CallCenter.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.CallCenter;

[Route("api/call-center")]
[Tags("CallCenter")]
public sealed class CallCenterController(
    ICallCenterService callCenterService,
    ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet("courses/{courseId:guid}/lectures/{lectureId:guid}/students")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCallCenter])]
    [SwaggerOperation(OperationId = "GetCallCenterStudents")]
    public async Task<ApiWrapper.Success<PageList<CallCenterStudentDto>>> GetStudents(
        Guid courseId,
        Guid lectureId,
        [FromQuery] string? search,
        [FromQuery] string? attendance,
        [FromQuery] string? called,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await callCenterService.QueryAsync(new GetCallCenterStudentsQuery
        {
            CourseId = courseId,
            LectureId = lectureId,
            Search = search,
            Attendance = attendance,
            Called = called,
            Page = page,
            PageSize = pageSize
        });

        return new()
        {
            Data = result,
            Message = "Call center students retrieved successfully"
        };
    }

    [HttpPut("courses/{courseId:guid}/lectures/{lectureId:guid}/students/{studentId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCallCenter])]
    [SwaggerOperation(OperationId = "UpsertCallCenterStudent")]
    public async Task<ApiWrapper.Success<CallCenterStudentDto>> UpsertStudent(
        Guid courseId,
        Guid lectureId,
        Guid studentId,
        [FromBody] UpsertCallCenterStudentRequest request)
    {
        var currentUser = await currentUserService.GetUserAsync()
            ?? throw new ApiException(AuthErrors.Unauthorized);

        var result = await callCenterService.ExecuteAsync(new UpsertCallCenterStudentCommand
        {
            CourseId = courseId,
            LectureId = lectureId,
            StudentId = studentId,
            Comment = request.Comment,
            Called = request.Called,
            ActorId = currentUser.Id
        });

        return new()
        {
            Data = result,
            Message = "Call log updated successfully"
        };
    }

    [HttpGet("courses/{courseId:guid}/lectures/{lectureId:guid}/students/export")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCallCenter])]
    [SwaggerOperation(OperationId = "ExportCallCenterStudents")]
    public async Task<IActionResult> ExportStudents(
        Guid courseId,
        Guid lectureId,
        [FromQuery] string? search,
        [FromQuery] string? attendance,
        [FromQuery] string? called)
    {
        var data = callCenterService.ExportAsync(new ExportCallCenterStudentsQuery
        {
            CourseId = courseId,
            LectureId = lectureId,
            Search = search,
            Attendance = attendance,
            Called = called
        });

        Response.Headers.Append("Content-Type", "text/csv");
        Response.Headers.Append(
            "Content-Disposition",
            "attachment; filename=call-center-students.csv");

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
}
