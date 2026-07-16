namespace LearnMS.API.Features.Statistics.Contracts;

public sealed record GetLectureStatisticsQuery(
    DateTimeOffset? StartDate,
    DateTimeOffset? EndDate,
    Guid? CenterId
);

public sealed record GetLectureStatisticsResponse(
    long EnrolledStudents,
    long AttendedStudents,
    decimal AverageHomeworksScore,
    decimal AverageQuizzesScore,
    long OnlineIncome,
    long OfflineIncome
);