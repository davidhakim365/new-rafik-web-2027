using System.ComponentModel.DataAnnotations;
using LearnMS.API.Entities;
using Newtonsoft.Json;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record UpdateExamRequest
{
    public Guid? Id { get; set; }

    [Required, MinLength(3), MaxLength(100)]
    public required string Title { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    public required ResultType ResultType { get; set; }

    [Required]
    public required decimal Price { get; set; }

    [Required]
    public required decimal RetakePrice { get; set; }

    [Required]
    public required int PassCount { get; set; }

    [Required]
    public required int ExpiryHours { get; set; }

    [Required]
    public required List<Guid> Questions { get; set; }
}

public sealed record UpdateExamCommand
{
    public Guid? Id;
    public required Guid CourseId;
    public required string Title;
    public required decimal Price;
    public required decimal RetakePrice;
    public required string Description;
    public required ResultType ResultType;
    public required int PassCount;
    public required int ExpiryHours;
    public required List<Guid> Questions;
}

public sealed record UpdateExamResponse
{
    [Required]
    public Guid? Id { get; set; }

    [Required]
    public required string Title { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    public required ResultType ResultType { get; set; }

    [Required]
    public required int PassCount { get; set; }

    [Required]
    public required List<Question> Questions { get; set; }

    [Required]
    public required int ExpiryHours { get; set; }

    [Required]
    public required decimal Price { get; set; }

    [Required]
    public required decimal RetakePrice { get; set; }
}

public sealed record UpdateExamResult
{
    public required Guid Id;
    public required string Title;
    public required string Description;
    public required ResultType ResultType;
    public required int PassCount;
    public required List<Question> Questions;
    public required int ExpiryHours;
    public required decimal Price;
    public required decimal RetakePrice;
}
