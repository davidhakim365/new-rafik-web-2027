namespace LearnMS.API.Entities;

public class PaymentRequestRejectionReason
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Text { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
