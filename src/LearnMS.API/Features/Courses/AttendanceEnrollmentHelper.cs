using LearnMS.API.Entities;

namespace LearnMS.API.Features.Courses;

public static class AttendanceEnrollmentHelper
{
    private static readonly TimeZoneInfo EgyptTimeZone = ResolveEgyptTimeZone();

    /// <summary>
    /// Grants or refreshes a same-day lecture enrollment for a center attendance.
    /// Does not shorten an existing paid enrollment that is still active / longer-lived.
    /// </summary>
    public static void EnsureAttendanceEnrollment(Lecture lecture, Guid studentId, DateTime attendedAtUtc)
    {
        var endOfAttendDayUtc = GetEgyptEndOfAttendDayUtc(attendedAtUtc);
        var enrollment = lecture.LectureEnrollments.FirstOrDefault(x => x.StudentId == studentId);

        if (enrollment is null)
        {
            lecture.LectureEnrollments.Add(new LectureEnrollment
            {
                StudentId = studentId,
                LectureId = lecture.Id,
                EnrolledAt = attendedAtUtc,
                ExpiresAt = endOfAttendDayUtc,
                IsFromAttendance = true
            });
            return;
        }

        // Keep paid / longer access intact.
        if (!enrollment.IsFromAttendance &&
            enrollment.ExpiresAt is { } expiresAt &&
            expiresAt > DateTime.UtcNow &&
            expiresAt > endOfAttendDayUtc)
        {
            return;
        }

        if (!enrollment.IsFromAttendance &&
            enrollment.ExpiresAt is { } paidExpires &&
            paidExpires > DateTime.UtcNow)
        {
            return;
        }

        enrollment.ExpiresAt = endOfAttendDayUtc;
        enrollment.IsFromAttendance = true;
    }

    /// <summary>
    /// Removes an attendance-granted enrollment when attendance is cleared.
    /// Paid / renewed enrollments are left alone.
    /// </summary>
    public static LectureEnrollment? ClearAttendanceEnrollmentIfNeeded(Lecture lecture, Guid studentId)
    {
        var enrollment = lecture.LectureEnrollments.FirstOrDefault(x => x.StudentId == studentId);
        if (enrollment is null || !enrollment.IsFromAttendance)
            return null;

        lecture.LectureEnrollments.Remove(enrollment);
        return enrollment;
    }

    /// <summary>
    /// End of the Egypt calendar day of attendance, as UTC
    /// (start of the next Egypt day — access while ExpiresAt &gt; UtcNow).
    /// </summary>
    public static DateTime GetEgyptEndOfAttendDayUtc(DateTime attendedAtUtc)
    {
        var utc = attendedAtUtc.Kind switch
        {
            DateTimeKind.Utc => attendedAtUtc,
            DateTimeKind.Local => attendedAtUtc.ToUniversalTime(),
            _ => DateTime.SpecifyKind(attendedAtUtc, DateTimeKind.Utc)
        };

        var local = TimeZoneInfo.ConvertTimeFromUtc(utc, EgyptTimeZone);
        var nextLocalMidnight = local.Date.AddDays(1);
        return TimeZoneInfo.ConvertTimeToUtc(nextLocalMidnight, EgyptTimeZone);
    }

    private static TimeZoneInfo ResolveEgyptTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows() ? "Egypt Standard Time" : "Africa/Cairo");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.CreateCustomTimeZone(
                "Africa/Cairo",
                TimeSpan.FromHours(2),
                "Africa/Cairo",
                "Africa/Cairo");
        }
    }
}
