using LearnMS.API.Common;

namespace LearnMS.API.Features.Profile;

public static class ProfileErrors
{
    public static readonly ApiError NotLoggedIn = new("profile/not-logged-in", "You are not logged in.", StatusCodes.Status401Unauthorized);
    public static readonly ApiError NoStudentFound = new("profile/no-student-found", "No student found", StatusCodes.Status404NotFound);
    public static readonly ApiError InsufficientCredits = new("profile/insufficient-credits", "Insufficient balance please contact 0122 234 3492", StatusCodes.Status400BadRequest);
    public static readonly ApiError NotFound = new("profile/not-found", "Profile not found", StatusCodes.Status404NotFound);
}