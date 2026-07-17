namespace LearnMS.API.Features.Rewards;

public sealed class RewardSystemConfig
{
    public const string Section = "RewardSystem";

    public int BaseSessionValue { get; init; } = 150;
    public int SessionsPerMilestone { get; init; } = 20;
    public int SessionBonusIncrement { get; init; } = 20;
}

public static class RewardSessionCalculator
{
    public static int CalculateSessionValue(RewardSystemConfig config, int sessionsAttended)
    {
        var milestoneSize = Math.Max(1, config.SessionsPerMilestone);
        var milestones = sessionsAttended / milestoneSize;
        return config.BaseSessionValue + milestones * config.SessionBonusIncrement;
    }

    public static int SessionsUntilNextBonus(RewardSystemConfig config, int sessionsAttended)
    {
        var milestoneSize = Math.Max(1, config.SessionsPerMilestone);
        var remainder = sessionsAttended % milestoneSize;
        return remainder == 0 ? milestoneSize : milestoneSize - remainder;
    }
}
