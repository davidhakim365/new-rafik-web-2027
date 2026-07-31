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

        var config = await GetConfigAsync();
        var currentValue = RewardSessionCalculator.CalculateSessionValue(config, assistant.SessionsAttended);
        return new AttendAssistantSessionResult
        {
            AssistantId = assistant.Id,
            FullName = assistant.FullName,
            Email = assistant.Accounts.First().Email,
            Code = assistant.Code,
            Apples = assistant.Apples,
            ApplesAdded = command.Amount,
            SessionsAttended = assistant.SessionsAttended,
            CurrentSessionValue = currentValue,
            SessionsUntilNextBonus = RewardSessionCalculator.SessionsUntilNextBonus(config, assistant.SessionsAttended),
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

        return await ApplyStudentApplesAsync(student, command.Amount, command.Reason, command.ActorId);
    }

    public async Task<AddStudentApplesResult> ExecuteAsync(AddStudentApplesByCodeCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Code))
            throw new ApiException(RewardsErrors.CodeRequired);
        if (command.Amount == 0)
            throw new ApiException(RewardsErrors.InvalidAmount);

        var code = command.Code.Trim();
        var student = await db.Students.FirstOrDefaultAsync(x => x.StudentCode == code)
            ?? throw new ApiException(RewardsErrors.StudentNotFound);

        var cooldown = await GetScannerCooldownAsync(student.Id);
        if (cooldown.RemainingSeconds > 0)
            throw new ApiException(RewardsErrors.StudentScannerCooldown(cooldown.RemainingSeconds));

        return await ApplyStudentApplesAsync(student, command.Amount, command.Reason, command.ActorId);
    }

    public async Task<StudentAppleLookupResult> QueryAsync(LookupStudentByCodeQuery query)
    {
        if (string.IsNullOrWhiteSpace(query.Code))
            throw new ApiException(RewardsErrors.CodeRequired);

        var code = query.Code.Trim();
        var student = await db.Students.FirstOrDefaultAsync(x => x.StudentCode == code)
            ?? throw new ApiException(RewardsErrors.StudentNotFound);

        var cooldown = await GetScannerCooldownAsync(student.Id);

        return new StudentAppleLookupResult
        {
            StudentId = student.Id,
            FullName = student.FullName,
            StudentCode = student.StudentCode,
            Apples = student.Apples,
            CooldownRemainingSeconds = cooldown.RemainingSeconds,
            CooldownEndsAt = cooldown.EndsAt
        };
    }

    public async Task<AssistantLookupResult> QueryAsync(LookupAssistantByCodeQuery query)
    {
        if (string.IsNullOrWhiteSpace(query.Code))
            throw new ApiException(RewardsErrors.CodeRequired);

        var code = query.Code.Trim();
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

        var config = await GetConfigAsync();
        var account = assistant.Accounts.First();
        return new AssistantLookupResult
        {
            AssistantId = assistant.Id,
            FullName = string.IsNullOrWhiteSpace(assistant.FullName) ? account.Email : assistant.FullName,
            Email = account.Email,
            ProfilePicture = account.ProfilePicture,
            Code = assistant.Code,
            Apples = assistant.Apples,
            SessionsAttended = assistant.SessionsAttended,
            CurrentSessionValue = RewardSessionCalculator.CalculateSessionValue(config, assistant.SessionsAttended)
        };
    }

    public Task<AssistantRewardsResult> QueryAsync(GetAssistantRewardsQuery query)
        => BuildAssistantRewardsAsync(query.AssistantId);

    public Task<AssistantRewardsResult> QueryAsync(GetMyRewardsQuery query)
        => BuildAssistantRewardsAsync(query.AssistantId);

    public async Task<RewardSystemSettingsResult> GetSystemSettingsAsync()
    {
        var settings = await GetOrCreateSettingsAsync();
        return MapSettings(settings);
    }

    public async Task<RewardSystemSettingsResult> UpdateSystemSettingsAsync(UpsertRewardSystemSettingsRequest request)
    {
        ValidateSystemSettings(request);

        var settings = await GetOrCreateSettingsAsync();
        settings.BaseSessionValue = request.BaseSessionValue;
        settings.SessionsPerMilestone = request.SessionsPerMilestone;
        settings.SessionBonusIncrement = request.SessionBonusIncrement;
        settings.MaxSessionValue = request.MaxSessionValue;
        settings.UpdatedAt = DateTime.UtcNow;

        db.RewardSystemSettings.Update(settings);
        await db.SaveChangesAsync();
        return MapSettings(settings);
    }

    private const int ScannerCooldownMinutes = 10;
    private const string ScannerReasonPrefix = "Scanner";

    private async Task<(int RemainingSeconds, DateTime? EndsAt)> GetScannerCooldownAsync(Guid studentId)
    {
        var since = DateTime.UtcNow.AddMinutes(-ScannerCooldownMinutes);
        var lastAt = await db.Set<StudentAppleTransaction>()
            .AsNoTracking()
            .Where(t =>
                t.StudentId == studentId &&
                t.CreatedAt >= since &&
                t.Reason != null &&
                t.Reason.StartsWith(ScannerReasonPrefix))
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => (DateTime?)t.CreatedAt)
            .FirstOrDefaultAsync();

        if (lastAt is null)
            return (0, null);

        var endsAt = lastAt.Value.AddMinutes(ScannerCooldownMinutes);
        var remaining = (int)Math.Ceiling((endsAt - DateTime.UtcNow).TotalSeconds);
        if (remaining <= 0)
            return (0, null);

        return (remaining, endsAt);
    }

    private async Task<AddStudentApplesResult> ApplyStudentApplesAsync(
        Student student,
        int amount,
        string? reason,
        Guid? actorId)
    {
        student.AddApples(actorId, amount, reason, out var transaction);
        await db.Set<StudentAppleTransaction>().AddAsync(transaction);
        db.Students.Update(student);
        await db.SaveChangesAsync();

        var message =
            $"{(amount > 0 ? "Added" : "Removed")} {Math.Abs(amount)} apples for {student.FullName}. Balance: {student.Apples}";

        return new AddStudentApplesResult
        {
            StudentId = student.Id,
            FullName = student.FullName,
            StudentCode = student.StudentCode,
            Apples = student.Apples,
            AmountAdded = amount,
            Message = message
        };
    }

    private async Task<AttendAssistantSessionResult> AttendSessionAsync(Assistant assistant, Guid? actorId)
    {
        var config = await GetConfigAsync();
        var sessionValue = RewardSessionCalculator.CalculateSessionValue(config, assistant.SessionsAttended);
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

        var nextValue = RewardSessionCalculator.CalculateSessionValue(config, assistant.SessionsAttended);
        var untilBonus = RewardSessionCalculator.SessionsUntilNextBonus(config, assistant.SessionsAttended);
        var atMax = RewardSessionCalculator.IsAtMaxSessionValue(config, assistant.SessionsAttended);
        var projectedNextBonus = Math.Min(
            nextValue + config.SessionBonusIncrement,
            Math.Max(config.BaseSessionValue, config.MaxSessionValue));

        string message;
        if (atMax)
        {
            message =
                $"Added {sessionValue} apples for session attendance. Session value is at the maximum of {config.MaxSessionValue}.";
        }
        else if (untilBonus == config.SessionsPerMilestone &&
                 assistant.SessionsAttended % Math.Max(1, config.SessionsPerMilestone) == 0)
        {
            message = $"Added {sessionValue} apples. Session value increased! Next session worth {nextValue} apples.";
        }
        else
        {
            message =
                $"Added {sessionValue} apples for session attendance. {untilBonus} session(s) until value increases to {projectedNextBonus}.";
        }

        return new AttendAssistantSessionResult
        {
            AssistantId = assistant.Id,
            FullName = assistant.FullName,
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

        var config = await GetConfigAsync();
        var currentValue = RewardSessionCalculator.CalculateSessionValue(config, assistant.SessionsAttended);
        return new AssistantRewardsResult
        {
            Id = assistant.Id,
            FullName = assistant.FullName,
            Email = assistant.Accounts.First().Email,
            ProfilePicture = assistant.Accounts.First().ProfilePicture,
            Code = assistant.Code,
            Apples = assistant.Apples,
            SessionsAttended = assistant.SessionsAttended,
            CurrentSessionValue = currentValue,
            NextSessionValue = currentValue,
            SessionsUntilNextBonus = RewardSessionCalculator.SessionsUntilNextBonus(config, assistant.SessionsAttended),
            BaseSessionValue = config.BaseSessionValue,
            SessionsPerMilestone = config.SessionsPerMilestone,
            SessionBonusIncrement = config.SessionBonusIncrement,
            MaxSessionValue = config.MaxSessionValue,
            Events = events
        };
    }

    private async Task<RewardSystemConfig> GetConfigAsync()
    {
        var settings = await GetOrCreateSettingsAsync();
        return new RewardSystemConfig
        {
            BaseSessionValue = settings.BaseSessionValue,
            SessionsPerMilestone = settings.SessionsPerMilestone,
            SessionBonusIncrement = settings.SessionBonusIncrement,
            MaxSessionValue = settings.MaxSessionValue
        };
    }

    private async Task<RewardSystemSettings> GetOrCreateSettingsAsync()
    {
        var settings = await db.RewardSystemSettings
            .FirstOrDefaultAsync(x => x.Id == RewardSystemSettings.SingletonId);

        if (settings is not null)
            return settings;

        var defaults = rewardOptions.Value;
        settings = new RewardSystemSettings
        {
            Id = RewardSystemSettings.SingletonId,
            BaseSessionValue = defaults.BaseSessionValue,
            SessionsPerMilestone = defaults.SessionsPerMilestone,
            SessionBonusIncrement = defaults.SessionBonusIncrement,
            MaxSessionValue = defaults.MaxSessionValue,
            UpdatedAt = DateTime.UtcNow
        };
        await db.RewardSystemSettings.AddAsync(settings);
        await db.SaveChangesAsync();
        return settings;
    }

    private static void ValidateSystemSettings(UpsertRewardSystemSettingsRequest request)
    {
        if (request.BaseSessionValue <= 0 ||
            request.SessionsPerMilestone <= 0 ||
            request.SessionBonusIncrement <= 0 ||
            request.MaxSessionValue < request.BaseSessionValue)
        {
            throw new ApiException(RewardsErrors.InvalidRewardSystemSettings);
        }
    }

    private static RewardSystemSettingsResult MapSettings(RewardSystemSettings settings) => new()
    {
        BaseSessionValue = settings.BaseSessionValue,
        SessionsPerMilestone = settings.SessionsPerMilestone,
        SessionBonusIncrement = settings.SessionBonusIncrement,
        MaxSessionValue = settings.MaxSessionValue,
        UpdatedAt = settings.UpdatedAt
    };
}
