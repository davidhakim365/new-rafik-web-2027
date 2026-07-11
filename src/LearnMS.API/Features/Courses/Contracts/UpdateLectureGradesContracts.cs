namespace LearnMS.API.Features.Courses.Contracts;

public sealed record UpdateLectureGradesCommand(
    Guid CourseId,
    Guid LectureId,
    List<StudentGradeItem> Grades
);

public sealed record UpdateLectureGradesRequest
{
    public List<StudentGradeItem> Grades { get; set; } = [];
}

public sealed record StudentGradeItem(string Code);
