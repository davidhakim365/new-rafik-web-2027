using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Entities;

public sealed class Quiz : IOrdered
{
    public Guid Id { get; set; }
    public int Order { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public ResultType ResultType { get; set; } = ResultType.ResultWithAnswer;
    public int PassCount { get; set; }

    public List<Question> Questions { get; } = [];

    [JsonIgnore]
    public Guid LectureId { get; set; }

    [JsonIgnore]
    public Lecture Lecture { get; set; } = null!;

    public List<Student> SubmittedStudents { get; } = [];
    public List<QuizSubmission> QuizSubmissions { get; } = [];

    public List<QuizQuestion> QuizQuestions { get; } = [];
}

public class QuizQuestion
{
    public Guid QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public Guid QuestionId { get; set; }
    public Question Question { get; set; } = null!;

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ResultType
{
    Hidden,
    ResultOnly,
    ResultWithAnswer,
}

[JsonDerivedType(typeof(QuizDashboard), nameof(QuizDashboard))]
[JsonDerivedType(typeof(QuizNotAnswered), nameof(QuizNotAnswered))]
[JsonDerivedType(typeof(QuizHidden), nameof(QuizHidden))]
[JsonDerivedType(typeof(QuizResultOnly), nameof(QuizResultOnly))]
[JsonDerivedType(typeof(QuizResultWithAnswer), nameof(QuizResultWithAnswer))]
public abstract record QuizResult { };

public sealed record QuizDashboard : QuizResult
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Title { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    public required int PassCount { get; set; }

    [Required]
    public required ResultType ResultType { get; set; }

    [Required]
    public required List<Question> Questions { get; set; }
}

public record QuizNotAnswered : QuizResult
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Title { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    public required List<MultipleChoiceNotAnswered> MultipleChoiceQuestions { get; set; }

    [Required]
    public required List<ValueToleranceNotAnswered> ValueToleranceQuestions { get; set; }

    [Required]
    public required int PassCount { get; set; }
}

public record QuizHidden : QuizResult
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Title { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    public required int PassCount { get; set; }

    [Required]
    public required int NumOfQuestions { get; set; }

    [Required]
    public required List<MultipleChoiceWithStudentAnswer> MultipleChoiceQuestions { get; set; }

    [Required]
    public required List<ValueToleranceWithStudentAnswer> ValueToleranceQuestions { get; set; }
}

public record QuizResultOnly : QuizResult
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Title { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    public required int PassCount { get; set; }

    [Required]
    public required int NumOfQuestions { get; set; }

    [Required]
    public required int NumOfCorrect { get; set; }

    [Required]
    public required List<MultipleChoiceWithStudentAnswer> MultipleChoiceQuestions { get; set; }

    [Required]
    public required List<ValueToleranceWithStudentAnswer> ValueToleranceQuestions { get; set; }
}

public record QuizResultWithAnswer : QuizResult
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Title { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    public required int PassCount { get; set; }

    [Required]
    public required int NumOfQuestions { get; set; }

    [Required]
    public required int NumOfCorrect { get; set; }

    [Required]
    public required List<MultipleChoiceWithCorrectAnswer> MultipleChoiceQuestions { get; set; }

    [Required]
    public required List<ValueToleranceWithCorrectAnswer> ValueToleranceQuestions { get; set; }
}
