using LearnMS.API.Common;
using LearnMS.API.Common.StorageService;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Questions.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LearnMS.API.Features.Questions;

public class QuestionsService(AppDbContext db, StorageService storageService) : IQuestionsService
{
    public async Task ExecuteAsync(AddQuestionCommand command)
    {
        Question question;

        if (command.MultipleChoices is not null && command.MultipleCorrect is not null)
        {
            question = new Question
            {
                Description = command.Description,
                Text = command.Text,
                Body = new MultipleChoiceQuestion
                {
                    Choices = command.MultipleChoices,
                    CorrectAnswer = command.MultipleCorrect
                }
            };

        }
        else if (command.ValueCorrect is not null && command.ValueTolerance is not null)
        {
            question = new Question
            {
                Description = command.Description,
                Text = command.Text,
                Body = new ValueToleranceQuestion
                {

                    CorrectAnswer = command.ValueCorrect.Value,
                    Tolerance = command.ValueTolerance.Value
                }
            };
        }
        else
        {

            throw new ApiException(QuestionsErrors.InvalidQuestion);
        }

        if (command.Image is IFormFile file)
        {
            using var stream = file.OpenReadStream();
            question.Image = await storageService.SaveAsync(Question.BasePath, stream, Path.GetExtension(file.FileName));
        }


        await db.Set<Question>().AddAsync(question);
        await db.SaveChangesAsync();
    }

    public async Task ExecuteAsync(DeleteQuestionCommand command)
    {
        var question = await db.Set<Question>().FirstOrDefaultAsync(x => x.Id == command.Id) ??
        throw new ApiException(QuestionsErrors.NotFound);

        if (
            !string.IsNullOrWhiteSpace(question.Image)
        )
        {
            storageService.Delete(question.Image);
        }

        db.Remove(question);

        await db.SaveChangesAsync();
    }

    public async Task<PageList<Question>> QueryAsync(GetQuestionsQuery query)
    {
        string search = "";

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            search = query.Search.ToLower().Trim();
        }



        var result = await PageList<Question>.CreateAsync(
            db.Set<Question>().AsNoTracking().Where(x => x.Text.ToLower().Contains(search) ||  x.Description.ToLower().Contains(search)).OrderByDescending(x=>x.CreatedAt).ThenBy(x=>x.Description).ThenBy(x=>x.Text),
            query.Page,
            query.PageSize
        );

        return result;
    }
}