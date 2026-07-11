using LearnMS.API.Entities;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record ExportCreditCodesQuery
{
    public CreditCodeStatus? Status { get; init; }
}

public sealed record ExportSingleCreditCodeResult
{
    public required string Code { get; init; }
    public required decimal Value { get; init; }
    public string? GeneratedBy { get; init; }
    public required DateTime GeneratedAt { get; init; }
    public required CreditCodeStatus Status { get; init; }
    public string? SoldBy { get; init; }
    public required DateTime? SoldAt { get; init; }
    public string? RedeemedBy { get; init; }
    public required DateTime? RedeemedAt { get; init; }
}