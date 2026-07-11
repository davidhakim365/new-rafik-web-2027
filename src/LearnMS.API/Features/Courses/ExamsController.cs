using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Courses.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Courses;

[ApiController]
[Route("api/courses/{courseId:guid}/exams")]
public sealed class ExamsController(ICoursesService coursesService) : ControllerBase
{
    [HttpPost("{examId:guid}/buy")]
    [ApiAuthorize(Role = UserRole.Student)]
    [SwaggerOperation(OperationId = "BuyExam")]
    public async Task<ApiWrapper.Success<object?>> Buy(Guid examId, Guid courseId)
    {
        var currentUser = HttpContext.CurrentUser()!;

        await coursesService.ExecuteAsync(
            new BuyExamCommand
            {
                CourseId = courseId,
                ExamId = examId,
                StudentId = currentUser.Id
            }
        );

        return new ApiWrapper.Success<object?> { Message = "Exam purchased successfully" };
    }

    [HttpGet("{examId:guid}")]
    [SwaggerOperation(OperationId = "GetExam")]
    public async Task<ApiWrapper.Success<ExamResult>> Get(Guid courseId, Guid examId)
    {
        var user = HttpContext.CurrentUser()!;

        ExamResult result;

        if (user.Role == UserRole.Student)
            result = await coursesService.QueryAsync(
                new GetExamQuery
                {
                    CourseId = courseId,
                    Id = examId,
                    StudentId = user.Id
                }
            );
        else
            result = await coursesService.QueryAsync(
                new GetExamQuery { CourseId = courseId, Id = examId }
            );

        return new ApiWrapper.Success<ExamResult> { Data = result };
    }

    [HttpPost("{examId:guid}/submit")]
    [ApiAuthorize(Role = UserRole.Student)]
    [SwaggerOperation(OperationId = "SubmitExam")]
    public async Task<ApiWrapper.Success<object>> Submit(
        [FromBody] SubmitExamRequest request,
        Guid courseId,
        Guid examId
    )
    {
        var currentUser = HttpContext.CurrentUser()!;

        await coursesService.ExecuteAsync(
            new SubmitExamCommand
            {
                CourseId = courseId,
                ExamId = examId,
                QuestionAnswers = request.QuestionAnswers,
                StudentId = currentUser.Id
            }
        );

        return new ApiWrapper.Success<object> { Message = "Submitted successfully" };
    }

    [HttpDelete("{examId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "DeleteExam")]
    public async Task<ApiWrapper.Success<object?>> Delete(Guid courseId, Guid examId)
    {
        await coursesService.ExecuteAsync(
            new DeleteExamCommand { CourseId = courseId, Id = examId }
        );
        return new ApiWrapper.Success<object?> { Message = "Exam deleted successfully" };
    }

    [HttpPut]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "UpdateExam")]
    public async Task<ApiWrapper.Success<UpdateExamResponse>> UpdateAsync(
        [FromBody] UpdateExamRequest request,
        Guid courseId
    )
    {
        var result = await coursesService.ExecuteAsync(
            new UpdateExamCommand
            {
                CourseId = courseId,
                Description = request.Description,
                Id = request.Id,
                Title = request.Title,
                PassCount = request.PassCount,
                ExpiryHours = request.ExpiryHours,
                Price = request.Price,
                Questions = request.Questions,
                ResultType = request.ResultType,
                RetakePrice = request.RetakePrice
            }
        );

        return new ApiWrapper.Success<UpdateExamResponse>
        {
            Data = new UpdateExamResponse
            {
                Id = result.Id,
                PassCount = result.PassCount,
                Description = result.Description,
                Title = result.Title,
                Questions = result.Questions,
                ResultType = result.ResultType,
                RetakePrice = result.RetakePrice,
                ExpiryHours = result.ExpiryHours,
                Price = result.Price
            },
            Message =
                request.Id == Guid.Empty || request.Id == null
                    ? "Exam created successfully"
                    : "Exam updated successfully"
        };
    }

    [HttpPost("{examId:guid}/students/{studentId:guid}/enroll")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "EnrollStudentInExam")]
    public async Task<ApiWrapper.Success<object?>> EnrollStudent(
        Guid examId,
        Guid studentId,
        Guid courseId
    )
    {
        await coursesService.ExecuteAsync(
            new EnrollStudentInExamCommand
            {
                StudentId = studentId,
                ExamId = examId,
                CourseId = courseId
            }
        );

        return new ApiWrapper.Success<object?> { Message = "student enrolled successfully" };
    }

    [HttpGet("{examId:guid}/students")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "GetExamStudents")]
    public async Task<ApiWrapper.Success<PageList<SingleExamStudent>>> GetStudents(
        Guid examId,
        Guid courseId,
        string? search,
        int page = 1,
        int pageSize = 10
    )
    {
        var result = await coursesService.QueryAsync(
            new GetExamStudentsQuery
            {
                ExamId = examId,
                CourseId = courseId,
                Search = search,
                Page = page,
                PageSize = pageSize
            }
        );

        return new ApiWrapper.Success<PageList<SingleExamStudent>> { Data = result };
    }
}
