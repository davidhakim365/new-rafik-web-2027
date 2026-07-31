using System.ComponentModel.DataAnnotations;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record GetLectureStudentsQuery
{
    public required Guid CourseId;
    public required Guid LectureId;
    public string? Search;
    public int Page = 1;
    public int PageSize = 10;
    /// <summary>
    /// When set, includes that lecture's Choose Homework score for comparison/import preview.
    /// </summary>
    public Guid? CompareChooseHomeworkLectureId;
}

public sealed record SingleLectureStudent
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string StudentCode { get; set; }
    [Required] public required string FullName { get; set; }
    [Required] public required string Email { get; set; }
    [Required] public decimal? HomeworkScore { get; set; }
    [Required] public decimal? ChooseHomeworkScore { get; set; }
    public decimal? CompareChooseHomeworkScore { get; set; }
    [Required] public decimal? QuizScore { get; set; }
    [Required] public decimal? StudentQuizzesScore { get; set; }
    [Required] public decimal? TotalQuizzesScore { get; set; }
    [Required] public required bool Attended { get; set; }
    [Required] public required bool Enrolled { get; set; }
    public Guid? CenterId { get; set; }
    public string? CenterName { get; set; }
}