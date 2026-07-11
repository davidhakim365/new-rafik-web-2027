using LearnMS.API.Entities;
using LearnMS.API.Features.Questions.Contracts;

namespace LearnMS.API.Features.Questions;

public interface IQuestionsService
{
    public Task ExecuteAsync(AddQuestionCommand command);
    public Task ExecuteAsync(DeleteQuestionCommand command);
    public Task<PageList<Question>> QueryAsync(GetQuestionsQuery query);
}
