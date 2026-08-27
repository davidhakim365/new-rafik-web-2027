using System.Globalization;
using LearnMS.API.Entities;
using LearnMS.API.Features.Courses.Contracts;
using LearnMS.API.Features.Questions;
using LearnMS.API.Features.Questions.Contracts;

namespace LearnMS.API.Features.Courses;

public static class AssessmentHelpers
{
    public static List<QuestionSubmission> BuildSubmissions(
        IEnumerable<Question> questions,
        IEnumerable<QuestionAnswer>? answers)
    {
        var byId = (answers ?? [])
            .GroupBy(a => a.QuestionId)
            .ToDictionary(g => g.Key, g => g.Last().Answer ?? "");

        return questions.Select(question =>
        {
            byId.TryGetValue(question.Id, out var answer);
            return BuildSubmission(question, answer ?? "");
        }).ToList();
    }

    public static QuestionSubmission BuildSubmission(Question question, string? answer)
    {
        answer ??= "";
        return question.Body switch
        {
            MultipleChoiceQuestion mc => new MultipleChoiceSubmission
            {
                Choices = mc.Choices,
                CorrectAnswer = mc.CorrectAnswer,
                QuestionId = question.Id,
                StudentAnswer = answer
            },
            ValueToleranceQuestion vt => BuildValueToleranceSubmission(question.Id, vt, answer),
            EssayQuestion => new EssaySubmission
            {
                QuestionId = question.Id,
                StudentAnswer = answer,
                // Unanswered essays are scored as incorrect so timeout submit is not left pending.
                IsGradedCorrect = string.IsNullOrWhiteSpace(answer) ? false : null
            },
            _ => throw new InvalidOperationException("Unknown question type")
        };
    }

    private static ValueToleranceSubmission BuildValueToleranceSubmission(
        Guid questionId,
        ValueToleranceQuestion vt,
        string answer)
    {
        if (!decimal.TryParse(answer, NumberStyles.Number, CultureInfo.InvariantCulture, out var value)
            && !decimal.TryParse(answer, NumberStyles.Number, CultureInfo.CurrentCulture, out value))
        {
            return new ValueToleranceSubmission
            {
                QuestionId = questionId,
                StudentAnswer = 0,
                Tolerance = vt.Tolerance,
                CorrectAnswer = vt.CorrectAnswer,
                Unanswered = true
            };
        }

        return new ValueToleranceSubmission
        {
            QuestionId = questionId,
            StudentAnswer = value,
            Tolerance = vt.Tolerance,
            CorrectAnswer = vt.CorrectAnswer,
            Unanswered = false
        };
    }

    public static int CountCorrect(IEnumerable<QuestionSubmission> submissions) =>
        submissions.Count(x => x.IsCorrect);

    public static List<Question> CreateInlineQuestions(
        string sourceTitle,
        IReadOnlyList<InlineQuestionPayload> payloads,
        int startIndex = 1)
    {
        var created = new List<Question>();
        var index = startIndex;
        foreach (var payload in payloads)
        {
            var label = $"{sourceTitle} - Q{index}";
            var text = string.IsNullOrWhiteSpace(payload.Text) ? label : payload.Text!;
            var description = string.IsNullOrWhiteSpace(payload.Description) ? label : payload.Description!;

            created.Add(QuestionsService.BuildQuestion(
                text,
                description,
                payload.Image,
                payload.QuestionType,
                payload.MultipleChoices,
                payload.MultipleCorrect,
                payload.ValueCorrect,
                payload.ValueTolerance,
                payload.EssayMaxLength,
                sourceTitle,
                index));
            index++;
        }

        return created;
    }

    public static List<MultipleChoiceNotAnswered> MapMcNotAnswered(IEnumerable<Question> questions) =>
        questions.Where(q => q.Body is MultipleChoiceQuestion)
            .Select(q => new MultipleChoiceNotAnswered
            {
                Choices = ((MultipleChoiceQuestion)q.Body).Choices,
                Description = q.Description,
                Id = q.Id,
                Image = q.Image,
                Text = q.Text
            }).ToList();

    public static List<ValueToleranceNotAnswered> MapVtNotAnswered(IEnumerable<Question> questions) =>
        questions.Where(q => q.Body is ValueToleranceQuestion)
            .Select(q => new ValueToleranceNotAnswered
            {
                Description = q.Description,
                Id = q.Id,
                Image = q.Image,
                Text = q.Text,
                Tolerance = ((ValueToleranceQuestion)q.Body).Tolerance
            }).ToList();

    public static List<EssayNotAnswered> MapEssayNotAnswered(IEnumerable<Question> questions) =>
        questions.Where(q => q.Body is EssayQuestion)
            .Select(q => new EssayNotAnswered
            {
                Description = q.Description,
                Id = q.Id,
                Image = q.Image,
                Text = q.Text,
                MaxLength = ((EssayQuestion)q.Body).MaxLength
            }).ToList();

    public static List<MultipleChoiceWithCorrectAnswer> MapMcWithCorrect(
        IEnumerable<MultipleChoiceSubmission> subs,
        IReadOnlyDictionary<Guid, Question> questionsById) =>
        subs.Select(x => new MultipleChoiceWithCorrectAnswer
        {
            Choices = x.Choices,
            CorrectAnswer = x.CorrectAnswer,
            Id = x.QuestionId,
            IsCorrect = x.IsCorrect,
            StudentAnswer = x.StudentAnswer,
            Description = questionsById[x.QuestionId].Description,
            Image = questionsById[x.QuestionId].Image,
            Text = questionsById[x.QuestionId].Text
        }).ToList();

    public static List<ValueToleranceWithCorrectAnswer> MapVtWithCorrect(
        IEnumerable<ValueToleranceSubmission> subs,
        IReadOnlyDictionary<Guid, Question> questionsById) =>
        subs.Select(x => new ValueToleranceWithCorrectAnswer
        {
            CorrectAnswer = x.CorrectAnswer,
            IsCorrect = x.IsCorrect,
            Id = x.QuestionId,
            Description = questionsById[x.QuestionId].Description,
            Image = questionsById[x.QuestionId].Image,
            StudentAnswer = x.StudentAnswer,
            Text = questionsById[x.QuestionId].Text,
            Tolerance = x.Tolerance
        }).ToList();

    public static List<EssayWithCorrectAnswer> MapEssayWithCorrect(
        IEnumerable<EssaySubmission> subs,
        IReadOnlyDictionary<Guid, Question> questionsById) =>
        subs.Select(x => new EssayWithCorrectAnswer
        {
            Id = x.QuestionId,
            Description = questionsById[x.QuestionId].Description,
            Image = questionsById[x.QuestionId].Image,
            Text = questionsById[x.QuestionId].Text,
            StudentAnswer = x.StudentAnswer,
            IsGradedCorrect = x.IsGradedCorrect,
            IsPendingGrade = x.IsPendingGrade,
            IsCorrect = x.IsGradedCorrect
        }).ToList();

    public static List<MultipleChoiceWithStudentAnswer> MapMcWithStudent(
        IEnumerable<MultipleChoiceSubmission> subs,
        IReadOnlyDictionary<Guid, Question> questionsById) =>
        subs.Select(x => new MultipleChoiceWithStudentAnswer
        {
            Choices = x.Choices,
            Description = questionsById[x.QuestionId].Description,
            Image = questionsById[x.QuestionId].Image,
            Text = questionsById[x.QuestionId].Text,
            StudentAnswer = x.StudentAnswer,
            Id = x.QuestionId
        }).ToList();

    public static List<ValueToleranceWithStudentAnswer> MapVtWithStudent(
        IEnumerable<ValueToleranceSubmission> subs,
        IReadOnlyDictionary<Guid, Question> questionsById) =>
        subs.Select(x => new ValueToleranceWithStudentAnswer
        {
            Description = questionsById[x.QuestionId].Description,
            Image = questionsById[x.QuestionId].Image,
            StudentAnswer = x.StudentAnswer,
            Text = questionsById[x.QuestionId].Text,
            Tolerance = x.Tolerance,
            Id = x.QuestionId
        }).ToList();

    public static List<EssayWithStudentAnswer> MapEssayWithStudent(
        IEnumerable<EssaySubmission> subs,
        IReadOnlyDictionary<Guid, Question> questionsById) =>
        subs.Select(x => new EssayWithStudentAnswer
        {
            Description = questionsById[x.QuestionId].Description,
            Image = questionsById[x.QuestionId].Image,
            Text = questionsById[x.QuestionId].Text,
            StudentAnswer = x.StudentAnswer,
            Id = x.QuestionId,
            IsGradedCorrect = x.IsGradedCorrect,
            IsPendingGrade = x.IsPendingGrade
        }).ToList();
}
