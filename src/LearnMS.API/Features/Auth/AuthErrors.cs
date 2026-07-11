using LearnMS.API.Common;

namespace LearnMS.API.Features.Auth;

public abstract class AuthErrors
{
    public static readonly ApiError InvalidCredentials = new("auth/invalid-credentials", "Email not found Please Sign up", StatusCodes.Status401Unauthorized);
    public static readonly ApiError InCorrectPassword = new("auth/in-correct-password", "Password is incorrect", StatusCodes.Status401Unauthorized);
    public static readonly ApiError NotVerifiedEmail = new("auth/not-verified-email", "Email is not verified", StatusCodes.Status401Unauthorized);
    public static readonly ApiError EmailAlreadyExists = new("auth/email-already-exists", "Email already exists", StatusCodes.Status409Conflict);
    public static readonly ApiError code = new("auth/email-already-code", "ID already assigned with another account", StatusCodes.Status409Conflict);

    public static readonly ApiError Unauthorized = new("auth/unauthorized", "Cannot access", StatusCodes.Status401Unauthorized);
    public static readonly ApiError Forbidden = new("auth/forbidden", "Cannot access", StatusCodes.Status403Forbidden);
    public static readonly ApiError AlreadyDeviceAssociated = new("auth/already-device-associated", "Another device is linked with this account", StatusCodes.Status401Unauthorized);
    public static readonly ApiError InvalidToken = new("auth/invalid-token", "Invalid token", StatusCodes.Status401Unauthorized);
}