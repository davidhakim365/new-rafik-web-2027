using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Courses.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Courses;

[ApiController]
[Route("api/courses/{courseId:guid}/lectures/{lectureId:guid}/quizzes")]
public sealed class QuizzesController(ICoursesService coursesService, ICurrentUserService currentUserService)
    : ControllerBase
{
    [HttpGet("{quizId:guid}", Name = "getQuiz")]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "GetQuiz")]
    public async Task<ApiWrapper.Success<QuizResult>> Get(Guid courseId, Guid lectureId, Guid quizId)
    {
        var user = await currentUserService.GetUserAsync();

        QuizResult result;

        if (user!.Role == UserRole.Student)
            result = await coursesService.QueryAsync(new GetStudentQuizQuery
            {
                CourseId = courseId,
                LectureId = lectureId,
                QuizId = quizId,
                StudentId = user.Id
            });
        else
            result = await coursesService.QueryAsync(new GetQuizQuery
            {
                CourseId = courseId,
                LectureId = lectureId,
                Id = quizId
            });


        return new ApiWrapper.Success<QuizResult>
        {
            Data = result
        };
    }

    [HttpPost("{quizId:guid}/submit")]
    [ApiAuthorize(Role = UserRole.Student)]
    [SwaggerOperation(OperationId = "SubmitQuiz")]
    public async Task<ApiWrapper.Success<object>> Submit([FromBody] SubmitQuizRequest request, Guid courseId,
        Guid lectureId, Guid quizId)
    {
        var currentUser = await currentUserService.GetUserAsync();

        await coursesService.ExecuteAsync(new SubmitQuizCommand
        {
            CourseId = courseId,
            LectureId = lectureId,
            QuestionAnswers = request.QuestionAnswers,
            QuizId = quizId,
            StudentId = currentUser!.Id
        });

        return new ApiWrapper.Success<object>
        {
            Message = "Submitted successfully"
        };
    }


    [HttpPut]
    [SwaggerOperation(OperationId = "UpdateQuiz")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    public async Task<ApiWrapper.Success<UpdateQuizResponse>> Put(UpdateQuizRequest request, Guid courseId,
        Guid lectureId)
    {
        var result = await coursesService.ExecuteAsync(new UpdateQuizCommand
        {
            PassCount = request.PassCount,
            CourseId = courseId,
            LectureId = lectureId,
            Title = request.Title,
            Description = request.Description,
            Questions = request.Questions,
            ResultType = request.ResultType,
            Id = request.Id
        });

        return new ApiWrapper.Success<UpdateQuizResponse>
        {
            Data = new UpdateQuizResponse
            {
                Id = result.Id,
                PassCount = result.PassCount,
                Description = result.Description,
                Title = result.Title,
                Questions = result.Questions,
                ResultType = result.ResultType
            },
            Message = request.Id == Guid.Empty || request.Id == null
                ? "Quiz created successfully"
                : "Quiz updated successfully"
        };
    }

    [HttpDelete("{quizId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "DeleteQuiz")]
    public async Task<ApiWrapper.Success<object?>> Delete(Guid courseId, Guid lectureId, Guid quizId)
    {
        await coursesService.ExecuteAsync(new DeleteQuizCommand
        {
            CourseId = courseId,
            LectureId = lectureId,
            Id = quizId
        });
        return new ApiWrapper.Success<object?>
        {
            Message = "Quiz deleted successfully"
        };
    }

    [HttpPost("{quizId:guid}/retake")]
    [ApiAuthorize(Role = UserRole.Student)]
    [SwaggerOperation(OperationId = "RetakeQuiz")]
    public async Task<ApiWrapper.Success<object>> Retake(Guid courseId, Guid lectureId, Guid quizId)
    {
        var user = HttpContext.CurrentUser()!;
        await coursesService.ExecuteAsync(new RetakeQuizCommand
        {
            CourseId = courseId,
            LectureId = lectureId,
            QuizId = quizId,
            StudentId = user.Id
        });

        return new ApiWrapper.Success<object>
        {
            Message = "Quiz retaken successfully"
        };
    }
}