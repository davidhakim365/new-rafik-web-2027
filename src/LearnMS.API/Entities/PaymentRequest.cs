using System.Text.Json.Serialization;

namespace LearnMS.API.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PaymentRequestStatus
{
    Pending,
    Confirmed,
    Rejected
}

public class PaymentRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid StudentId { get; set; }
    public required decimal Amount { get; set; }
    public required string ImageUrl { get; set; }
    public string? ImageThumbUrl { get; set; }
    public string? Note { get; set; }
    public PaymentRequestStatus Status { get; set; } = PaymentRequestStatus.Pending;
    public Guid? ReviewedById { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }

    public Student? Student { get; set; }
}
