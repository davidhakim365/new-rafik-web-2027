namespace LearnMS.API.Features.Statistics.Contracts;

public sealed record GetIncomeStatisticsQuery(
    DateTimeOffset? StartDate,
    DateTimeOffset? EndDate
);

public sealed record GetIncomesStatisticsResponse(
    long TotalStudents,
    long OnlineIncomes,
    long OfflineIncomes
);