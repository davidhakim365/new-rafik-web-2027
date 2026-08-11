namespace LearnMS.API.Entities;

public class RewardSystemSettings
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;
    public int BaseSessionValue { get; set; } = 150;
    public int SessionsPerMilestone { get; set; } = 20;
    public int SessionBonusIncrement { get; set; } = 20;
    public int MaxSessionValue { get; set; } = 200;
    /// <summary>
    /// When false, session attendance still increments but milestone bonuses are not applied
    /// (each session pays only <see cref="BaseSessionValue"/>).
    /// </summary>
    public bool BonusesEnabled { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
