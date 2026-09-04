namespace LearnMS.API.Features.Courses;

public static class LectureQuizAnswerAccess
{
    public const string LockAttendance = "attendance";
    public const string LockEnroll = "enroll";
    public const string LockPassQuiz = "passQuiz";

    public static bool IsOnlineStudent(string? studentCode) =>
        !string.IsNullOrWhiteSpace(studentCode) &&
        studentCode.StartsWith("ONL-", StringComparison.OrdinalIgnoreCase);

    public static (bool CanView, string? LockReason) Evaluate(
        string? studentCode,
        bool isEnrolled,
        bool hasAttended,
        bool hasAnyQuiz,
        bool passedAllQuizzes)
    {
        if (string.IsNullOrWhiteSpace(studentCode))
            return (false, LockEnroll);

        if (IsOnlineStudent(studentCode))
        {
            if (!isEnrolled)
                return (false, LockEnroll);
            if (!hasAnyQuiz || !passedAllQuizzes)
                return (false, LockPassQuiz);
            return (true, null);
        }

        if (!hasAttended)
            return (false, LockAttendance);

        return (true, null);
    }
}
