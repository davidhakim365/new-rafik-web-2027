using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Entities;



public record Question
{
    [NotMapped] public const string BasePath = "questions";

    [Required] public Guid Id { get; set; }
    [Required] public string Text { get; set; } = null!;
    [Required] public string Description { get; set; } = null!;
    public string? Image { get; set; }
    [Required] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore] public string BodyJson { get; set; } = null!;

    [NotMapped]
    [Required]
    public QuestionBody Body
    {
        get => System.Text.Json.JsonSerializer.Deserialize<QuestionBody>(BodyJson)!;
        init => BodyJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    [JsonIgnore] public List<Exam> Exams { get; } = [];
    [JsonIgnore] public List<ExamQuestion> ExamQuestions { get; } = [];

    [JsonIgnore] public List<Quiz> Quizzes { get; } = [];
    [JsonIgnore] public List<QuizQuestion> QuizQuestions { get; } = [];
}

[JsonDerivedType(typeof(MultipleChoiceQuestion), nameof(MultipleChoiceQuestion))]
[JsonDerivedType(typeof(ValueToleranceQuestion), nameof(ValueToleranceQuestion))]
public abstract class QuestionBody
{
}

public class MultipleChoiceQuestion : QuestionBody
{
    [Required] public required string CorrectAnswer { get; set; }
    [Required] public required List<string> Choices { get; set; }
}

public class ValueToleranceQuestion : QuestionBody
{
    [Required] public required decimal CorrectAnswer { get; set; }
    [Required] public required decimal Tolerance { get; set; }
}

[JsonDerivedType(typeof(MultipleChoiceSubmission), "MultipleChoice")]
[JsonDerivedType(typeof(ValueToleranceSubmission), "ValueTolerance")]
public abstract class QuestionSubmission
{
    public required Guid QuestionId { get; set; }

    public abstract bool IsCorrect { get; }
}

public class MultipleChoiceSubmission : QuestionSubmission
{
    public required string StudentAnswer { get; set; }
    public required List<string> Choices { get; set; }
    public required string CorrectAnswer { get; set; }
    public override bool IsCorrect => StudentAnswer == CorrectAnswer;
}

public class ValueToleranceSubmission : QuestionSubmission
{
    public required decimal StudentAnswer { get; set; }
    public required decimal CorrectAnswer { get; set; }
    public required decimal Tolerance { get; set; }
    public override bool IsCorrect => Math.Abs(StudentAnswer - CorrectAnswer) <= Tolerance;
}

public record MultipleChoiceNotAnswered
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required] public required List<string> Choices { get; set; }
}

public record ValueToleranceNotAnswered
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required] public required decimal Tolerance { get; set; }
}

public record MultipleChoiceWithStudentAnswer
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required] public required List<string> Choices { get; set; }
    [Required] public required string StudentAnswer { get; set; }
}

public record ValueToleranceWithStudentAnswer
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required] public required decimal Tolerance { get; set; }
    [Required] public required decimal StudentAnswer { get; set; }
}

public record ValueToleranceWithCorrectAnswer
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required] public required decimal Tolerance { get; set; }
    [Required] public required decimal CorrectAnswer { get; set; }
    [Required] public required decimal StudentAnswer { get; set; }
    [Required] public required bool IsCorrect { get; set; }
}

public record MultipleChoiceWithCorrectAnswer
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required] public required List<string> Choices { get; set; }
    [Required] public required string CorrectAnswer { get; set; }
    [Required] public required string StudentAnswer { get; set; }
    [Required] public required bool IsCorrect { get; set; }
}