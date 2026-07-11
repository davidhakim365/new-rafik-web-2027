namespace LearnMS.API.Features.Statistics.Contracts;

public sealed record LectureItem(
    Guid Id,
    Guid CourseId,
    string Title,
    string CourseTitle,
    string? ImageUrl,
    long LessonsCount,
    long QuizzesCount,
    long EnrollmentsCount
);