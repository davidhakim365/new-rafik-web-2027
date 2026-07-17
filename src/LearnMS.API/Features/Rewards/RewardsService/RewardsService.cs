using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Rewards.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LearnMS.API.Features.Rewards;

public sealed class RewardsService(
    AppDbContext db,
    IOptions<RewardSystemConfig> rewardOptions) : IRewardsService
{
    private RewardSystemConfig Config => rewardOptions.Value;

    public async Task<AttendAssistantSessionResult> ExecuteAsync(AttendAssistantSessionCommand command)
    {
        var assistant = await db.Assistants.Include(x => x.Accounts)
            .FirstOrDefaultAsync(x => x.Id == command.AssistantId)
            ?? throw new ApiException(RewardsErrors.AssistantNotFound);

        return await AttendSessionAsync(assistant, command.ActorId);
    }

    public async Task<AttendAssistantSessionResult> ExecuteAsync(AttendAssistantByCodeCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Code))
            throw new ApiException(RewardsErrors.CodeRequired);

        var code = command.Code.Trim();
        Assistant? assistant = null;

        if (Guid.TryParse(code, out var assistantId))
        {
            assistant = await db.Assistants.Include(x => x.Accounts)
                .FirstOrDefaultAsync(x => x.Id == assistantId);
        }

        assistant ??= await db.Assistants.Include(x => x.Accounts)
            .FirstOrDefaultAsync(x => x.Code == code);

        if (assistant is null)
            throw new ApiException(RewardsErrors.AssistantNotFound);

        return await AttendSessionAsync(assistant, command.ActorId);
    }

    public async Task<AttendAssistantSessionResult> ExecuteAsync(AdjustAssistantApplesCommand command)
    {
        if (command.Amount == 0)
            throw new ApiException(RewardsErrors.InvalidAmount);

        var assistant = await db.Assistants.Include(x => x.Accounts)
            .FirstOrDefaultAsync(x => x.Id == command.AssistantId)
            ?? throw new ApiException(RewardsErrors.AssistantNotFound);

        assistant.Apples = Math.Max(0, assistant.Apples + command.Amount);

        var rewardEvent = new AssistantRewardEvent
        {
            AssistantId = assistant.Id,
            ActorId = command.ActorId,
            Type = AssistantRewardEventType.ManualAdjust,
            Amount = command.Amount,
            SessionsAttendedAfter = assistant.SessionsAttended,
            Reason = command.Reason ?? (command.Amount > 0 ? "Manual apple adjustment" : "Apple deduction")
        };

        await db.Set<AssistantRewardEvent>().AddAsync(rewardEvent);
        db.Assistants.Update(assistant);
        await db.SaveChangesAsync();

        var currentValue = RewardSessionCalculator.CalculateSessionValue(Config, assistant.SessionsAttended);
        return new AttendAssistantSessionResult
        {
            AssistantId = assistant.Id,
            Email = assistant.Accounts.First().Email,
            Code = assistant.Code,
            Apples = assistant.Apples,
            ApplesAdded = command.Amount,
            SessionsAttended = assistant.SessionsAttended,
            CurrentSessionValue = currentValue,
            SessionsUntilNextBonus = RewardSessionCalculator.SessionsUntilNextBonus(Config, assistant.SessionsAttended),
            Message = $"{(command.Amount > 0 ? "Added" : "Subtracted")} {Math.Abs(command.Amount)} apples"
        };
    }

    public async Task<PayAssistantRewardsResult> ExecuteAsync(PayAssistantRewardsCommand command)
    {
        var query = db.Assistants.AsQueryable();
        if (command.AssistantId is not null)
            query = query.Where(x => x.Id == command.AssistantId);

        var assistants = await query.Where(x => x.Apples > 0).ToListAsync();
        var totalPaid = 0;

        foreach (var assistant in assistants)
        {
            var paid = assistant.Apples;
            totalPaid += paid;

            await db.Set<AssistantRewardEvent>().AddAsync(new AssistantRewardEvent
            {
                AssistantId = assistant.Id,
                ActorId = command.ActorId,
                Type = AssistantRewardEventType.Payout,
                Amount = paid,
                SessionsAttendedAfter = assistant.SessionsAttended,
                Reason = "Pay rewards"
            });

            assistant.Apples = 0;
        }

        if (assistants.Count > 0)
        {
            db.Assistants.UpdateRange(assistants);
            await db.SaveChangesAsync();
        }

        return new PayAssistantRewardsResult
        {
            AssistantsPaid = assistants.Count,
            TotalApplesPaid = totalPaid,
            Message = assistants.Count == 0
                ? "No assistant rewards to pay"
                : $"Paid {totalPaid} apples across {assistants.Count} assistant(s)"
        };
    }

    public async Task<AddStudentApplesResult> ExecuteAsync(AddStudentApplesCommand command)
    {
        if (command.Amount == 0)
            throw new ApiException(RewardsErrors.InvalidAmount);

        var student = await db.Students.FirstOrDefaultAsync(x => x.Id == command.StudentId)
            ?? throw new ApiException(RewardsErrors.StudentNotFound);

        student.AddApples(command.ActorId, command.Amount, command.Reason, out var transaction);
        await db.Set<StudentAppleTransaction>().AddAsync(transaction);
        db.Students.Update(student);
        await db.SaveChangesAsync();

        return new AddStudentApplesResult
        {
            StudentId = student.Id,
            Apples = student.Apples,
            AmountAdded = command.Amount
        };
    }

    public Task<AssistantRewardsResult> QueryAsync(GetAssistantRewardsQuery query)
        => BuildAssistantRewardsAsync(query.AssistantId);

    public Task<AssistantRewardsResult> QueryAsync(GetMyRewardsQuery query)
        => BuildAssistantRewardsAsync(query.AssistantId);

    private async Task<AttendAssistantSessionResult> AttendSessionAsync(Assistant assistant, Guid? actorId)
    {
        var sessionValue = RewardSessionCalculator.CalculateSessionValue(Config, assistant.SessionsAttended);
        assistant.Apples += sessionValue;
        assistant.SessionsAttended += 1;

        await db.Set<AssistantRewardEvent>().AddAsync(new AssistantRewardEvent
        {
            AssistantId = assistant.Id,
            ActorId = actorId,
            Type = AssistantRewardEventType.SessionAttendance,
            Amount = sessionValue,
            SessionsAttendedAfter = assistant.SessionsAttended,
            Reason = "Session attendance"
        });

        db.Assistants.Update(assistant);
        await db.SaveChangesAsync();

        var nextValue = RewardSessionCalculator.CalculateSessionValue(Config, assistant.SessionsAttended);
        var untilBonus = RewardSessionCalculator.SessionsUntilNextBonus(Config, assistant.SessionsAttended);
        var message =
            $"Added {sessionValue} apples for session attendance. {untilBonus} session(s) until value increases to {nextValue + Config.SessionBonusIncrement}.";

        if (untilBonus == Config.SessionsPerMilestone && assistant.SessionsAttended % Math.Max(1, Config.SessionsPerMilestone) == 0)
        {
            message = $"Added {sessionValue} apples. Session value increased! Next session worth {nextValue} apples.";
        }

        return new AttendAssistantSessionResult
        {
            AssistantId = assistant.Id,
            Email = assistant.Accounts.First().Email,
            Code = assistant.Code,
            Apples = assistant.Apples,
            ApplesAdded = sessionValue,
            SessionsAttended = assistant.SessionsAttended,
            CurrentSessionValue = nextValue,
            SessionsUntilNextBonus = untilBonus,
            Message = message
        };
    }

    private async Task<AssistantRewardsResult> BuildAssistantRewardsAsync(Guid assistantId)
    {
        var assistant = await db.Assistants.Include(x => x.Accounts)
            .FirstOrDefaultAsync(x => x.Id == assistantId)
            ?? throw new ApiException(RewardsErrors.AssistantNotFound);

        var events = await db.Set<AssistantRewardEvent>()
            .Where(x => x.AssistantId == assistantId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .Select(x => new AssistantRewardEventDto
            {
                Id = x.Id,
                Type = x.Type.ToString(),
                Amount = x.Amount,
                SessionsAttendedAfter = x.SessionsAttendedAfter,
                Reason = x.Reason,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        var currentValue = RewardSessionCalculator.CalculateSessionValue(Config, assistant.SessionsAttended);
        return new AssistantRewardsResult
        {
            Id = assistant.Id,
            Email = assistant.Accounts.First().Email,
            Code = assistant.Code,
            Apples = assistant.Apples,
            SessionsAttended = assistant.SessionsAttended,
            CurrentSessionValue = currentValue,
            NextSessionValue = currentValue,
            SessionsUntilNextBonus = RewardSessionCalculator.SessionsUntilNextBonus(Config, assistant.SessionsAttended),
            BaseSessionValue = Config.BaseSessionValue,
            SessionsPerMilestone = Config.SessionsPerMilestone,
            SessionBonusIncrement = Config.SessionBonusIncrement,
            Events = events
        };
    }
}
