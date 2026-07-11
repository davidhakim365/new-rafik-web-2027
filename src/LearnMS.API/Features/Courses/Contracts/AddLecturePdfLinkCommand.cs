namespace LearnMS.API.Features.Courses.Contracts;

public class AddLecturePdfLinkCommand
{
    public Guid LectureId { get; set; }
    public Guid CourseId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? Name { get; set; }
} 