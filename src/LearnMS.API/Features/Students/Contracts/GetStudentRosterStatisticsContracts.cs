using LearnMS.API.Entities;

namespace LearnMS.API.Features.Students.Contracts;

public sealed record GetStudentRosterStatisticsQuery
{
    public StudentLevel? Level { get; init; }
}

public sealed record StudentLevelRosterBucket(
    StudentLevel Level,
    int Total,
    int Online,
    int Offline
);

public sealed record GetStudentRosterStatisticsResponse(
    int Total,
    int Online,
    int Offline,
    int DeviceLinked,
    int Blocked,
    int WithCredit,
    int WithApples,
    IReadOnlyList<StudentLevelRosterBucket> ByLevel
);
