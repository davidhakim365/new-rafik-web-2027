using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Questions.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace LearnMS.API.Features.Questions;

[ApiController]
[Route("api/questions")]
public sealed class QuestionsController(IQuestionsService questionsService) : ControllerBase
{
    [HttpPost]
    public async Task<ApiWrapper.Success<object?>> Post([FromForm] AddQuestionRequest request)
    {
        await questionsService.ExecuteAsync(new AddQuestionCommand
        {
            Image = request.Image,
            Description = request.Description,
            MultipleChoices = request.MultipleChoices,
            MultipleCorrect = request.MultipleCorrect,
            ValueCorrect = request.ValueCorrect,
            level = request.level,
            ValueTolerance = request.ValueTolerance,
            Text = request.Text
        });

        return new()
        {
            Message = "Question added successfully"
        };
    }

    [HttpDelete("{questionId:guid}")]
    public async Task<ApiWrapper.Success<object?>> Delete(Guid questionId)
    {
        await questionsService.ExecuteAsync(new DeleteQuestionCommand
        {
            Id = questionId
        });

        return new()
        {
            Message = "Question deleted successfully"
        };
    }

    [HttpGet]
    public async Task<ApiWrapper.Success<PageList<Question>>> Get([FromQuery] GetQuestionsQuery query)
    {
        return new()
        {
            Data = await questionsService.QueryAsync(query)
        };
    }
}