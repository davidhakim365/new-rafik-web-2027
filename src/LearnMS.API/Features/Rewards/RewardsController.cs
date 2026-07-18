using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using LearnMS.API.Features.Rewards.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Rewards;

[Route("api/rewards")]
[Tags("Rewards")]
public sealed class RewardsController(
    IRewardsService rewardsService,
    ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet("me")]
    [ApiAuthorize(Role = UserRole.Assistant)]
    [SwaggerOperation(OperationId = "GetMyRewards")]
    public async Task<ApiWrapper.Success<AssistantRewardsResult>> GetMyRewards()
    {
        var currentUser = await currentUserService.GetUserAsync()
            ?? throw new ApiException(AuthErrors.Unauthorized);

        if (currentUser.Role != UserRole.Assistant)
            throw new ApiException(RewardsErrors.Forbidden);

        var result = await rewardsService.QueryAsync(new GetMyRewardsQuery
        {
            AssistantId = currentUser.Id
        });

        return new()
        {
            Data = result,
            Message = "Retrieved rewards successfully"
        };
    }

    [HttpGet("assistants/{assistantId:guid}")]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "GetAssistantRewards")]
    public async Task<ApiWrapper.Success<AssistantRewardsResult>> GetAssistantRewards(Guid assistantId)
    {
        await EnsureTeacherAsync();
        var result = await rewardsService.QueryAsync(new GetAssistantRewardsQuery
        {
            AssistantId = assistantId
        });

        return new()
        {
            Data = result,
            Message = "Retrieved assistant rewards successfully"
        };
    }

    [HttpPost("assistants/{assistantId:guid}/attend-session")]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "AttendAssistantSession")]
    public async Task<ApiWrapper.Success<AttendAssistantSessionResult>> AttendSession(Guid assistantId)
    {
        var teacher = await EnsureTeacherAsync();
        var result = await rewardsService.ExecuteAsync(new AttendAssistantSessionCommand
        {
            AssistantId = assistantId,
            ActorId = teacher.Id
        });

        return new()
        {
            Data = result,
            Message = result.Message
        };
    }

    [HttpPost("assistants/lookup")]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "LookupAssistantByCode")]
    public async Task<ApiWrapper.Success<AssistantLookupResult>> LookupAssistant(
        [FromBody] LookupAssistantByCodeRequest request)
    {
        await EnsureTeacherAsync();
        var result = await rewardsService.QueryAsync(new LookupAssistantByCodeQuery
        {
            Code = request.Code
        });

        return new()
        {
            Data = result,
            Message = "Assistant found"
        };
    }

    [HttpPost("assistants/attend-by-code")]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "AttendAssistantByCode")]
    public async Task<ApiWrapper.Success<AttendAssistantSessionResult>> AttendByCode(
        [FromBody] AttendAssistantByCodeRequest request)
    {
        var teacher = await EnsureTeacherAsync();
        var result = await rewardsService.ExecuteAsync(new AttendAssistantByCodeCommand
        {
            Code = request.Code,
            ActorId = teacher.Id
        });

        return new()
        {
            Data = result,
            Message = result.Message
        };
    }

    [HttpPost("assistants/{assistantId:guid}/apples")]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "AdjustAssistantApples")]
    public async Task<ApiWrapper.Success<AttendAssistantSessionResult>> AdjustApples(
        Guid assistantId,
        [FromBody] AdjustAssistantApplesRequest request)
    {
        var teacher = await EnsureTeacherAsync();
        var result = await rewardsService.ExecuteAsync(new AdjustAssistantApplesCommand
        {
            AssistantId = assistantId,
            Amount = request.Amount,
            Reason = request.Reason,
            ActorId = teacher.Id
        });

        return new()
        {
            Data = result,
            Message = result.Message
        };
    }

    [HttpPost("assistants/pay-rewards")]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "PayAssistantRewards")]
    public async Task<ApiWrapper.Success<PayAssistantRewardsResult>> PayRewards(
        [FromBody] PayAssistantRewardsRequest? request)
    {
        var teacher = await EnsureTeacherAsync();
        var result = await rewardsService.ExecuteAsync(new PayAssistantRewardsCommand
        {
            ActorId = teacher.Id,
            AssistantId = request?.AssistantId
        });

        return new()
        {
            Data = result,
            Message = result.Message
        };
    }

    [HttpPost("students/lookup")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudentApples, Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "LookupStudentByCode")]
    public async Task<ApiWrapper.Success<StudentAppleLookupResult>> LookupStudent(
        [FromBody] LookupStudentByCodeRequest request)
    {
        var result = await rewardsService.QueryAsync(new LookupStudentByCodeQuery
        {
            Code = request.Code
        });

        return new()
        {
            Data = result,
            Message = "Student found"
        };
    }

    [HttpPost("students/apples-by-code")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudentApples, Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "AddStudentApplesByCode")]
    public async Task<ApiWrapper.Success<AddStudentApplesResult>> AddStudentApplesByCode(
        [FromBody] AddStudentApplesByCodeRequest request)
    {
        var currentUser = await currentUserService.GetUserAsync()
            ?? throw new ApiException(AuthErrors.Unauthorized);

        var result = await rewardsService.ExecuteAsync(new AddStudentApplesByCodeCommand
        {
            Code = request.Code,
            Amount = request.Amount,
            Reason = request.Reason,
            ActorId = currentUser.Id
        });

        return new()
        {
            Data = result,
            Message = result.Message
        };
    }

    private async Task<CurrentUser> EnsureTeacherAsync()
    {
        var currentUser = await currentUserService.GetUserAsync()
            ?? throw new ApiException(AuthErrors.Unauthorized);

        if (currentUser.Role != UserRole.Teacher)
            throw new ApiException(RewardsErrors.Forbidden);

        return currentUser;
    }
}
