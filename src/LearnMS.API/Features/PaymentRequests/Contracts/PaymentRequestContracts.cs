using System.ComponentModel.DataAnnotations;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.PaymentRequests.Contracts;

public sealed class CreatePaymentRequestRequest
{
    [Required]
    public decimal Amount { get; init; }

    [MaxLength(500)]
    public string? Note { get; init; }

    public IFormFile? Image { get; init; }
}

public sealed class RejectPaymentRequestRequest
{
    [MaxLength(500)]
    public string? Reason { get; init; }
}

public sealed record CreatePaymentRequestCommand
{
    public required Guid StudentId { get; init; }
    public required decimal Amount { get; init; }
    public string? Note { get; init; }
    public required IFormFile Image { get; init; }
}

public sealed record GetMyPaymentRequestsQuery
{
    public required Guid StudentId { get; init; }
    public int? Page { get; init; }
    public int? PageSize { get; init; }
}

public sealed record GetPaymentRequestsQuery
{
    public int? Page { get; init; }
    public int? PageSize { get; init; }
    public string? Search { get; init; }
    public PaymentRequestStatus? Status { get; init; }
}

public sealed record ConfirmPaymentRequestCommand
{
    public required Guid Id { get; init; }
    public required Guid ReviewedById { get; init; }
    public Guid? AssistantId { get; init; }
}

public sealed record RejectPaymentRequestCommand
{
    public required Guid Id { get; init; }
    public required Guid ReviewedById { get; init; }
    public string? Reason { get; init; }
}

public sealed record PaymentRequestItem
{
    public required Guid Id { get; init; }
    public required decimal Amount { get; init; }
    public required string ImageUrl { get; init; }
    public string? ImageThumbUrl { get; init; }
    public string? Note { get; init; }
    public required PaymentRequestStatus Status { get; init; }
    public string? RejectionReason { get; init; }
    public required DateTime CreatedAt { get; init; }
    public DateTime? ReviewedAt { get; init; }
    public required Guid StudentId { get; init; }
    public required string StudentName { get; init; }
    public required string StudentEmail { get; init; }
    public required string StudentPhone { get; init; }
    public required string StudentCode { get; init; }
    public DateTime? LastRequestAt { get; init; }
    public decimal? LastRequestAmount { get; init; }
    public PaymentRequestStatus? LastRequestStatus { get; init; }
    public string? LastRequestImageUrl { get; init; }
    public string? LastRequestImageThumbUrl { get; init; }
    public string? LastRequestNote { get; init; }
}

public sealed record PaymentRequestStats
{
    public int Pending { get; init; }
    public int Confirmed { get; init; }
    public int Rejected { get; init; }
    public int Total => Pending + Confirmed + Rejected;
}

public sealed class CreatePaymentRequestRejectionReasonRequest
{
    [Required]
    [MaxLength(500)]
    public string Text { get; init; } = "";
}

public sealed record PaymentRequestRejectionReasonItem
{
    public required Guid Id { get; init; }
    public required string Text { get; init; }
    public required int SortOrder { get; init; }
}
