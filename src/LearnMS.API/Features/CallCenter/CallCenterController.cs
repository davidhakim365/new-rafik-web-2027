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
        [FromQuery] string? studyMode,
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
            StudyMode = studyMode,
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

    [HttpPost("courses/{courseId:guid}/lectures/{lectureId:guid}/students/{studentId:guid}/notify")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCallCenter])]
    [SwaggerOperation(OperationId = "RecordCallCenterNotify")]
    public async Task<ApiWrapper.Success<object?>> RecordNotify(
        Guid courseId,
        Guid lectureId,
        Guid studentId,
        [FromBody] RecordCallCenterNotifyRequest request)
    {
        var currentUser = await currentUserService.GetUserAsync()
            ?? throw new ApiException(AuthErrors.Unauthorized);

        await callCenterService.ExecuteAsync(new RecordCallCenterNotifyCommand
        {
            CourseId = courseId,
            LectureId = lectureId,
            StudentId = studentId,
            Comment = request.Comment,
            ActorId = currentUser.Id
        });

        return new()
        {
            Message = "Notify recorded successfully"
        };
    }

    [HttpGet("courses/{courseId:guid}/lectures/{lectureId:guid}/students/{studentId:guid}/history")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ViewCallCenterHistory])]
    [SwaggerOperation(OperationId = "GetCallCenterStudentHistory")]
    public async Task<ApiWrapper.Success<IReadOnlyList<CallCenterHistoryItemDto>>> GetHistory(
        Guid courseId,
        Guid lectureId,
        Guid studentId)
    {
        var result = await callCenterService.QueryAsync(new GetCallCenterHistoryQuery
        {
            CourseId = courseId,
            LectureId = lectureId,
            StudentId = studentId
        });

        return new()
        {
            Data = result,
            Message = "Call center history retrieved successfully"
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
        [FromQuery] string? called,
        [FromQuery] string? studyMode)
    {
        var data = callCenterService.ExportAsync(new ExportCallCenterStudentsQuery
        {
            CourseId = courseId,
            LectureId = lectureId,
            Search = search,
            Attendance = attendance,
            Called = called,
            StudyMode = studyMode
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

    [HttpPut("students/{studentId:guid}/block")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCallCenter])]
    [SwaggerOperation(OperationId = "SetCallCenterStudentBlocked")]
    public async Task<ApiWrapper.Success<SetCallCenterStudentBlockedResult>> SetBlocked(
        Guid studentId,
        [FromBody] SetCallCenterStudentBlockedRequest request)
    {
        var currentUser = await currentUserService.GetUserAsync()
            ?? throw new ApiException(AuthErrors.Unauthorized);

        var result = await callCenterService.ExecuteAsync(new SetCallCenterStudentBlockedCommand
        {
            StudentId = studentId,
            IsBlocked = request.IsBlocked,
            ActorId = currentUser.Id
        });

        return new()
        {
            Data = result,
            Message = result.IsBlocked
                ? "Student account blocked successfully"
                : "Student account unblocked successfully"
        };
    }
}
