using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed class AddLecturePdfLinksCommand
{
    public Guid LectureId { get; set; }
    public Guid CourseId { get; set; }
    public required List<AddLecturePdfLinkItem> Items { get; set; }
    public bool ForQuizAnswers { get; set; }
}

public sealed class AddLecturePdfLinkItem
{
    [Required]
    public required string Title { get; set; }

    [Required]
    public required string Url { get; set; }
}

public sealed class AddLecturePdfLinksResult
{
    public required List<Entities.Asset> Assets { get; init; }
}

public sealed class UploadLecturePdfCommand
{
    public Guid LectureId { get; set; }
    public Guid CourseId { get; set; }
    public required IFormFile File { get; set; }
    public string? Title { get; set; }
    public bool ForQuizAnswers { get; set; }
}

public sealed class UploadLecturePdfResult
{
    public required Entities.Asset Asset { get; init; }
}
