using System.ComponentModel.DataAnnotations;
using LearnMS.API.Entities;
using LearnMS.API.Features.Questions.Contracts;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record UpdateQuizRequest
{
    public Guid? Id { get; set; }
    [Required, MinLength(3), MaxLength(100)]
    public required string Title { get; set; }
    [Required]
    public required string Description { get; set; }
    [Required]
    public required ResultType ResultType { get; set; }
    [Required]
    public required int PassCount { get; set; }
    /// <summary>Time limit in minutes after start. 0 = no limit.</summary>
    public int ExpiryMinutes { get; set; }
    public List<Guid> Questions { get; set; } = [];
    public List<InlineQuestionPayload> NewQuestions { get; set; } = [];
}

public sealed record UpdateQuizCommand
{
    public Guid? Id;
    public required Guid CourseId;
    public required Guid LectureId;
    public required string Title;
    public required string Description;
    public required ResultType ResultType;
    public required int PassCount;
    public int ExpiryMinutes;
    public required List<Guid> Questions;
    public List<InlineQuestionPayload> NewQuestions = [];
}

public sealed record UpdateQuizResponse
{
    public Guid? Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required ResultType ResultType { get; set; }
    public required int PassCount { get; set; }
    public required int ExpiryMinutes { get; set; }
    public required List<Question> Questions { get; set; }
}

public sealed record UpdateQuizResult
{
    public required Guid Id;
    public required string Title;
    public required string Description;
    public required ResultType ResultType;
    public required int PassCount;
    public required int ExpiryMinutes;
    public required List<Question> Questions;
}
