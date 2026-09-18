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
        // Center attendance always unlocks (offline students).
        if (hasAttended)
            return (true, null);

        if (!isEnrolled)
            return (false, LockEnroll);

        // Any enrolled student who passed the lecture quiz(es) can view.
        // Do not require an ONL- student code — many online students do not have that prefix.
        if (hasAnyQuiz && passedAllQuizzes)
            return (true, null);

        if (hasAnyQuiz)
            return (false, LockPassQuiz);

        if (IsOnlineStudent(studentCode))
            return (true, null);

        return (false, LockAttendance);
    }
}
