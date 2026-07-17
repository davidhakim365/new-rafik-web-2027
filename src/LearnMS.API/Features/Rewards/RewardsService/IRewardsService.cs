using LearnMS.API.Features.Rewards.Contracts;

namespace LearnMS.API.Features.Rewards;

public interface IRewardsService
{
    Task<AttendAssistantSessionResult> ExecuteAsync(AttendAssistantSessionCommand command);
    Task<AttendAssistantSessionResult> ExecuteAsync(AttendAssistantByCodeCommand command);
    Task<AttendAssistantSessionResult> ExecuteAsync(AdjustAssistantApplesCommand command);
    Task<PayAssistantRewardsResult> ExecuteAsync(PayAssistantRewardsCommand command);
    Task<AddStudentApplesResult> ExecuteAsync(AddStudentApplesCommand command);
    Task<AddStudentApplesResult> ExecuteAsync(AddStudentApplesByCodeCommand command);
    Task<StudentAppleLookupResult> QueryAsync(LookupStudentByCodeQuery query);
    Task<AssistantRewardsResult> QueryAsync(GetAssistantRewardsQuery query);
    Task<AssistantRewardsResult> QueryAsync(GetMyRewardsQuery query);
}
