using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace LearnMS.API.Entities;

public sealed class Exam : IOrdered
{
    public Guid Id;
    public int Order { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public ResultType ResultType = ResultType.ResultWithAnswer;
    public decimal Price { get; set; }
    public decimal RetakePrice { get; set; }
    public int PassCount { get; set; }
    public int ExpiryHours { get; set; }

    public List<Question> Questions { get; } = [];

    [JsonIgnore]
    public Guid CourseId { get; set; }

    [JsonIgnore]
    public Course Course { get; } = null!;

    public List<Student> EnrolledStudents { get; } = [];
    public List<ExamEnrollment> ExamEnrollments { get; } = [];

    public List<ExamQuestion> ExamQuestions { get; } = [];
}

public class ExamQuestion
{
    public Guid ExamId { get; set; }
    public Exam Exam { get; set; } = null!;
    public Guid QuestionId { get; set; }
    public Question Question { get; set; } = null!;

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

[JsonDerivedType(typeof(ExamDashboard), nameof(ExamDashboard))]
[JsonDerivedType(typeof(ExamNotBought), nameof(ExamNotBought))]
[JsonDerivedType(typeof(ExamResultWithAnswer), nameof(ExamResultWithAnswer))]
[JsonDerivedType(typeof(ExamHidden), nameof(ExamHidden))]
[JsonDerivedType(typeof(ExamNotAnswered), nameof(ExamNotAnswered))]
[JsonDerivedType(typeof(ExamResultOnly), nameof(ExamResultOnly))]
public abstract class ExamResult { };

public sealed class ExamDashboard : ExamResult
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
    public required decimal Price { get; set; }

    [Required]
    public required decimal RetakePrice { get; set; }

    [Required]
    public required int ExpiryHours { get; set; }

    [Required]
    public required ResultType ResultType { get; set; }

    [Required]
    public required List<Question> Questions { get; set; }
}

public class ExamNotBought : ExamResult
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Title { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    public required decimal Price { get; set; }

    [Required]
    public required int PassCount { get; set; }

    [Required]
    public required int ExpiryHours { get; set; }

    [Required]
    public required int NumOfQuestions { get; set; }
}

public class ExamNotAnswered : ExamResult
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Title { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    public required decimal Price { get; set; }

    [Required]
    public required decimal RetakePrice { get; set; }

    [Required]
    public required DateTime ExpiresAt { get; set; }

    [Required]
    public required List<MultipleChoiceNotAnswered> MultipleChoiceQuestions { get; set; }

    [Required]
    public required List<ValueToleranceNotAnswered> ValueToleranceQuestions { get; set; }

    [Required]
    public required int PassCount { get; set; }
}

public class ExamHidden : ExamResult
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

public class ExamResultOnly : ExamResult
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
    public required decimal RetakePrice { get; set; }

    [Required]
    public required List<MultipleChoiceWithStudentAnswer> MultipleChoiceQuestions { get; set; }

    [Required]
    public required List<ValueToleranceWithStudentAnswer> ValueToleranceQuestions { get; set; }
}

public class ExamResultWithAnswer : ExamResult
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
    public required decimal RetakePrice { get; set; }

    [Required]
    public required int NumOfCorrect { get; set; }

    [Required]
    public required List<MultipleChoiceWithCorrectAnswer> MultipleChoiceQuestions { get; set; }

    [Required]
    public required List<ValueToleranceWithCorrectAnswer> ValueToleranceQuestions { get; set; }
}
