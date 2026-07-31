using LearnMS.API.Entities;

namespace LearnMS.API.Features.Courses;

public static class AttendanceEnrollmentHelper
{
    /// <summary>
    /// Creates or refreshes an immediately-expired lecture enrollment for center attendance
    /// so the next purchase uses RenewalPrice. Does not shorten an existing paid enrollment.
    /// </summary>
    public static void EnsureAttendanceEnrollment(Lecture lecture, Guid studentId, DateTime attendedAtUtc)
    {
        var attendedAt = NormalizeUtc(attendedAtUtc);
        // Expired immediately (access check uses ExpiresAt > UtcNow).
        var expiresAt = attendedAt;

        var enrollment = lecture.LectureEnrollments.FirstOrDefault(x => x.StudentId == studentId);

        if (enrollment is null)
        {
            lecture.LectureEnrollments.Add(new LectureEnrollment
            {
                StudentId = studentId,
                LectureId = lecture.Id,
                EnrolledAt = attendedAt,
                ExpiresAt = expiresAt,
                IsFromAttendance = true
            });
            return;
        }

        // Keep paid / active access intact.
        if (!enrollment.IsFromAttendance &&
            enrollment.ExpiresAt is { } paidExpires &&
            paidExpires > DateTime.UtcNow)
        {
            return;
        }

        enrollment.ExpiresAt = expiresAt;
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

    private static DateTime NormalizeUtc(DateTime value) =>
        value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
}
