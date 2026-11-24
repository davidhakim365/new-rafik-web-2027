using LearnMS.API.Common;

namespace LearnMS.API.Features.PushNotifications;

public static class PushNotificationsErrors
{
    public static readonly ApiError InvalidSubscription = new(
        "push/invalid-subscription",
        "This phone sent an invalid notification subscription. Turn alerts off and on again.",
        StatusCodes.Status400BadRequest);
}
