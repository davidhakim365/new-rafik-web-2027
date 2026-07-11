namespace LearnMS.API.Features.Questions.Contracts;


public class DeleteQuestionCommand
{
    public required Guid Id { get; set; }
}