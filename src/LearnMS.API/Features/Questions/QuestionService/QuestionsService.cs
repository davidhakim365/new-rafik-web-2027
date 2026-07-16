using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Questions.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.Questions;

public class QuestionsService(AppDbContext db) : IQuestionsService
{
    public async Task ExecuteAsync(AddQuestionCommand command)
    {
        var question = BuildQuestion(
            command.Text,
            command.Description,
            command.Image,
            command.QuestionType,
            command.MultipleChoices,
            command.MultipleCorrect,
            command.ValueCorrect,
            command.ValueTolerance,
            command.EssayMaxLength,
            command.SourceTitle,
            command.SourceIndex);

        await db.Set<Question>().AddAsync(question);
        await db.SaveChangesAsync();
    }

    public async Task ExecuteAsync(DeleteQuestionCommand command)
    {
        var question = await db.Set<Question>().FirstOrDefaultAsync(x => x.Id == command.Id) ??
                       throw new ApiException(QuestionsErrors.NotFound);

        db.Remove(question);
        await db.SaveChangesAsync();
    }

    public async Task<PageList<Question>> QueryAsync(GetQuestionsQuery query)
    {
        var search = "";
        if (!string.IsNullOrWhiteSpace(query.Search))
            search = query.Search.ToLower().Trim();

        return await PageList<Question>.CreateAsync(
            db.Set<Question>().AsNoTracking()
                .Where(x =>
                    x.Text.ToLower().Contains(search)
                    || x.Description.ToLower().Contains(search)
                    || (x.SourceTitle != null && x.SourceTitle.ToLower().Contains(search)))
                .OrderByDescending(x => x.CreatedAt)
                .ThenBy(x => x.SourceTitle)
                .ThenBy(x => x.SourceIndex)
                .ThenBy(x => x.Description)
                .ThenBy(x => x.Text),
            query.Page,
            query.PageSize);
    }

    public static Question BuildQuestion(
        string text,
        string description,
        string? image,
        string questionType,
        List<QuestionChoice>? multipleChoices,
        string? multipleCorrect,
        decimal? valueCorrect,
        decimal? valueTolerance,
        int? essayMaxLength,
        string? sourceTitle = null,
        int? sourceIndex = null)
    {
        QuestionBody body = questionType.ToLowerInvariant() switch
        {
            "multiplechoice" or "multiplechoicequestion" when multipleChoices is { Count: > 0 } &&
                                                               !string.IsNullOrWhiteSpace(multipleCorrect)
                => new MultipleChoiceQuestion
                {
                    Choices = NormalizeChoices(multipleChoices),
                    CorrectAnswer = multipleCorrect!
                },
            "valuetolerance" or "valuetolerancequestion" when valueCorrect is not null && valueTolerance is not null
                => new ValueToleranceQuestion
                {
                    CorrectAnswer = valueCorrect.Value,
                    Tolerance = valueTolerance.Value
                },
            "essay" or "essayquestion"
                => new EssayQuestion { MaxLength = essayMaxLength },
            _ => throw new ApiException(QuestionsErrors.InvalidQuestion)
        };

        return new Question
        {
            Id = Guid.NewGuid(),
            Text = text,
            Description = description,
            Image = image,
            SourceTitle = sourceTitle,
            SourceIndex = sourceIndex,
            Body = body,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static List<QuestionChoice> NormalizeChoices(List<QuestionChoice> choices)
    {
        return choices.Select((c, i) => new QuestionChoice
        {
            Id = string.IsNullOrWhiteSpace(c.Id) ? $"c{i + 1}" : c.Id,
            Text = c.Text,
            ImageUrl = c.ImageUrl
        }).ToList();
    }
}
