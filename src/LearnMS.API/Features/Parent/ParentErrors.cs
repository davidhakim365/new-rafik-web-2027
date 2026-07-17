using LearnMS.API.Common;

namespace LearnMS.API.Features.Parent;

public abstract class ParentErrors
{
    public static readonly ApiError InvalidCredentials = new(
        "parent/invalid-credentials",
        "Student ID or phone numbers do not match our records",
        StatusCodes.Status401Unauthorized);

    public static readonly ApiError InvalidToken = new(
        "parent/invalid-token",
        "Parent session expired. Please sign in again",
        StatusCodes.Status401Unauthorized);

    public static readonly ApiError StudentNotFound = new(
        "parent/student-not-found",
        "Student not found",
        StatusCodes.Status404NotFound);
}
