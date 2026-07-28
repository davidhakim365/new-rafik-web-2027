namespace LearnMS.API.Entities;

public class RewardSystemSettings
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;
    public int BaseSessionValue { get; set; } = 150;
    public int SessionsPerMilestone { get; set; } = 20;
    public int SessionBonusIncrement { get; set; } = 20;
    public int MaxSessionValue { get; set; } = 200;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
