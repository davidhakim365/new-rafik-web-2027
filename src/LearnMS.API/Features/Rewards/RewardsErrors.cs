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

    public static readonly ApiError StoreClosed =
        new("rewards/store-closed", "Apple rewards store is closed", StatusCodes.Status403Forbidden);

    public static readonly ApiError StoreItemNotFound =
        new("rewards/store-item-not-found", "Reward item not found", StatusCodes.Status404NotFound);

    public static readonly ApiError StoreOrderNotFound =
        new("rewards/store-order-not-found", "Reward order not found", StatusCodes.Status404NotFound);

    public static readonly ApiError StoreOrderNotActive =
        new("rewards/store-order-not-active", "This choice is already cancelled", StatusCodes.Status400BadRequest);

    public static readonly ApiError InsufficientApples =
        new("rewards/insufficient-apples", "Not enough apples for this item", StatusCodes.Status400BadRequest);

    public static readonly ApiError InvalidStoreItem =
        new("rewards/invalid-store-item", "Title, image, and a positive apple cost are required", StatusCodes.Status400BadRequest);

    public static readonly ApiError InvalidStoreWindow =
        new("rewards/invalid-store-window", "Closes at must be after opens at", StatusCodes.Status400BadRequest);
}
