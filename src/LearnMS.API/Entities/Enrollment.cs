namespace LearnMS.API.Entities;

public enum Enrollment
{
    Active,
    Expired,
    NotEnrolled
}

public static class EnrollmentStatus
{
    public static Enrollment FromExpiresAt(DateTime? expiresAt) =>
        expiresAt is null ? Enrollment.NotEnrolled
        : expiresAt >= DateTime.UtcNow ? Enrollment.Active
        : Enrollment.Expired;
}