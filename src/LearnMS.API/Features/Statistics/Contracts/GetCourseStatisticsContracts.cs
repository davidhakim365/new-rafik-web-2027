namespace LearnMS.API.Features.Statistics.Contracts;

public sealed record GetCourseStatisticsQuery(
    Guid CourseId
);

public sealed record GetCourseStatisticsResponse(
    List<LectureStudents> TotalStudents,
    List<LectureStudents> OnlineStudents,
    List<LectureStudents> AttendedStudents,
    List<LectureAverageScore> AverageHomeworksScores,
    List<LectureAverageScore> AverageQuizzesScores
);

public sealed record LectureStudents(string LectureName, int StudentCount);

public sealed record LectureAverageScore(string LectureName, decimal AverageScore);