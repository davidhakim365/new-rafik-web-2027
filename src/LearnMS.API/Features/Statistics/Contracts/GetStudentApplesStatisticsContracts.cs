using LearnMS.API.Entities;

namespace LearnMS.API.Features.Statistics.Contracts;

public sealed record GetStudentApplesStatisticsQuery(
    DateTimeOffset? StartDate,
    DateTimeOffset? EndDate,
    StudentLevel? Level
);

public sealed record StudentAppleLeaderboardItem(
    Guid StudentId,
    string FullName,
    string StudentCode,
    int Apples,
    StudentLevel Level
);

public sealed record StudentAppleDailyBucket(
    DateOnly Date,
    long Awarded,
    long Deducted,
    long Net
);

public sealed record StudentAppleLevelBucket(
    StudentLevel Level,
    long StudentsWithApples,
    long TotalApples
);

public sealed record GetStudentApplesStatisticsResponse(
    long StudentsWithApples,
    long TotalApplesOutstanding,
    long TransactionsInRange,
    long ApplesAwardedInRange,
    long ApplesDeductedInRange,
    long NetApplesInRange,
    IReadOnlyList<StudentAppleLeaderboardItem> TopStudents,
    IReadOnlyList<StudentAppleDailyBucket> ApplesByDay,
    IReadOnlyList<StudentAppleLevelBucket> ApplesByLevel
);
