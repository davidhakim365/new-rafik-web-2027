namespace LearnMS.API.Entities;

public class PaymentSettings
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;

    /// <summary>InstaPay number or handle shown to students. Empty hides it.</summary>
    public string? InstapayNumber { get; set; }

    /// <summary>Wallet number shown to students. Empty hides it.</summary>
    public string? WalletNumber { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
