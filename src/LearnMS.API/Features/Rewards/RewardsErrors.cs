using LearnMS.API.Common;

namespace LearnMS.API.Features.Rewards;

public static class RewardsErrors
{
    public static readonly ApiError AssistantNotFound =
        new("rewards/assistant-not-found", "Assistant not found", StatusCodes.Status404NotFound);

    public static readonly ApiError StudentNotFound =
        new("rewards/student-not-found", "Student not found", StatusCodes.Status404NotFound);

    public static readonly ApiError InvalidAmount =
        new("rewards/invalid-amount", "Apple amount cannot be zero", StatusCodes.Status400BadRequest);

    public static readonly ApiError CodeRequired =
        new("rewards/code-required", "Assistant code or id is required", StatusCodes.Status400BadRequest);

    public static readonly ApiError Forbidden =
        new("rewards/forbidden", "Only teachers can manage assistant rewards", StatusCodes.Status403Forbidden);
}
