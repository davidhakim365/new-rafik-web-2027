using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Parent.Contracts;
using LearnMS.API.Security.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LearnMS.API.Features.Parent;

public sealed class ParentService(AppDbContext db, IOptions<JwtBearerConfig> jwtOptions) : IParentService
{
    private const string TokenTypeClaim = "token_type";
    private const string ParentTokenType = "parent";
    private readonly JwtBearerConfig _jwtConfig = jwtOptions.Value;

    public async Task<ParentLoginResult> LoginAsync(ParentLoginCommand command)
    {
        var studentCode = command.StudentCode.Trim();
        var phone = NormalizePhone(command.PhoneNumber);
        var parentPhone = NormalizePhone(command.ParentPhoneNumber);

        var students = await db.Students
            .AsNoTracking()
            .Where(s => s.StudentCode.Trim().ToLower() == studentCode.ToLower())
            .ToListAsync();

        var student = students.FirstOrDefault(s =>
            NormalizePhone(s.PhoneNumber) == phone &&
            NormalizePhone(s.ParentPhoneNumber) == parentPhone);

        if (student is null)
            throw new ApiException(ParentErrors.InvalidCredentials);

        return new ParentLoginResult
        {
            Token = CreateParentToken(student.Id),
            Student = ToSummary(student)
        };
    }

    public async Task<ParentProgressResult> GetProgressAsync(string token)
    {
        var studentId = ValidateParentToken(token);

        var student = await db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == studentId)
            ?? throw new ApiException(ParentErrors.StudentNotFound);

        var lectures = await db.Set<Lecture>()
            .AsNoTracking()
            .Where(l => l.Course.IsPublished && l.Course.Level == student.Level)
            .Select(l => new
            {
                l.Id,
                l.Title,
                CourseTitle = l.Course.Title ?? "Course",
                AttendedAt = l.LectureAttendances
                    .Where(a => a.StudentId == studentId && a.AttendedAt != null)
                    .Select(a => (DateTime?)a.AttendedAt)
                    .FirstOrDefault(),
                LessonAttended = l.Lessons.Any(lesson =>
                    lesson.AttendedStudents.Any(s => s.Id == studentId)),
                HomeworkScore = l.LectureHomeworks
                    .Where(h => h.StudentId == studentId)
                    .Select(h => (decimal?)h.Score)
                    .FirstOrDefault(),
                OfflineQuizScore = l.LectureQuizzes
                    .Where(q => q.StudentId == studentId)
                    .Select(q => (decimal?)q.Score)
                    .FirstOrDefault(),
                OnlineCorrect = l.Quizzes
                    .SelectMany(q => q.QuizSubmissions.Where(sub => sub.StudentId == studentId))
                    .Sum(sub => (decimal?)sub.NumOfCorrect) ?? 0,
                OnlineTotal = l.Quizzes
                    .SelectMany(q => q.QuizSubmissions.Where(sub => sub.StudentId == studentId))
                    .Sum(sub => (decimal?)sub.NumOfQuestions) ?? 0,
                HasOnlineQuiz = l.Quizzes.Any(q =>
                    q.QuizSubmissions.Any(sub => sub.StudentId == studentId)),
            })
            .OrderBy(l => l.CourseTitle)
            .ThenBy(l => l.Title)
            .ToListAsync();

        var exams = await db.Set<Exam>()
            .AsNoTracking()
            .Where(e => e.Course.IsPublished && e.Course.Level == student.Level)
            .Select(e => new
            {
                e.Id,
                e.Title,
                CourseTitle = e.Course.Title ?? "Course",
                StudentScore = e.ExamEnrollments
                    .Where(en => en.StudentId == studentId)
                    .Select(en => en.Submission != null ? (decimal?)en.Submission.NumOfCorrect : null)
                    .FirstOrDefault(),
                TotalScore = e.ExamEnrollments
                    .Where(en => en.StudentId == studentId)
                    .Select(en => en.Submission != null ? (decimal?)en.Submission.NumOfQuestions : null)
                    .FirstOrDefault(),
                SubmittedAt = e.ExamEnrollments
                    .Where(en => en.StudentId == studentId)
                    .Select(en => en.Submission != null ? (DateTime?)en.Submission.SubmittedAt : null)
                    .FirstOrDefault(),
            })
            .OrderByDescending(e => e.SubmittedAt)
            .ThenBy(e => e.Title)
            .ToListAsync();

        var attendance = lectures.Select(l => new ParentAttendanceItem
        {
            LectureId = l.Id,
            LectureTitle = l.Title,
            CourseTitle = l.CourseTitle,
            Attended = l.AttendedAt != null || l.LessonAttended,
            AttendedAt = l.AttendedAt
        }).ToList();

        var quizGrades = lectures
            .Where(l =>
                l.OfflineQuizScore != null ||
                l.HomeworkScore != null ||
                l.HasOnlineQuiz)
            .Select(l => new ParentQuizGradeItem
            {
                LectureId = l.Id,
                LectureTitle = l.Title,
                CourseTitle = l.CourseTitle,
                OfflineQuizScore = l.OfflineQuizScore,
                HomeworkScore = l.HomeworkScore,
                OnlineCorrect = l.HasOnlineQuiz ? l.OnlineCorrect : null,
                OnlineTotal = l.HasOnlineQuiz ? l.OnlineTotal : null
            })
            .ToList();

        var examGrades = exams
            .Where(e => e.SubmittedAt != null || e.StudentScore != null)
            .Select(e => new ParentExamGradeItem
            {
                ExamId = e.Id,
                Title = e.Title,
                CourseTitle = e.CourseTitle,
                StudentScore = e.StudentScore,
                TotalScore = e.TotalScore,
                SubmittedAt = e.SubmittedAt
            })
            .ToList();

        var attendedCount = attendance.Count(a => a.Attended);
        var totalSessions = attendance.Count;

        var quizPercents = quizGrades
            .Select(q =>
            {
                if (q.OnlineTotal is > 0 && q.OnlineCorrect is not null)
                    return (decimal?)(q.OnlineCorrect.Value / q.OnlineTotal.Value * 100m);
                if (q.OfflineQuizScore is not null)
                    return q.OfflineQuizScore;
                return null;
            })
            .Where(p => p is not null)
            .Select(p => p!.Value)
            .ToList();

        var examPercents = examGrades
            .Where(e => e.TotalScore is > 0 && e.StudentScore is not null)
            .Select(e => e.StudentScore!.Value / e.TotalScore!.Value * 100m)
            .ToList();

        return new ParentProgressResult
        {
            Student = ToSummary(student),
            Statistics = new ParentStatistics
            {
                TotalSessions = totalSessions,
                AttendedSessions = attendedCount,
                AttendanceRate = totalSessions == 0
                    ? 0
                    : Math.Round(attendedCount * 100.0 / totalSessions, 1),
                QuizCount = quizGrades.Count,
                ExamCount = examGrades.Count,
                AverageQuizScorePercent = quizPercents.Count == 0
                    ? null
                    : Math.Round(quizPercents.Average(), 1),
                AverageExamScorePercent = examPercents.Count == 0
                    ? null
                    : Math.Round(examPercents.Average(), 1)
            },
            Attendance = attendance,
            QuizGrades = quizGrades,
            ExamGrades = examGrades
        };
    }

    private static ParentStudentSummary ToSummary(Student student) => new()
    {
        Id = student.Id,
        FullName = student.FullName,
        StudentCode = student.StudentCode,
        Level = student.Level,
        SchoolName = student.SchoolName
    };

    private string CreateParentToken(Guid studentId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, studentId.ToString()),
            new(ClaimTypes.Role, "Parent"),
            new(TokenTypeClaim, ParentTokenType)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtConfig.Secret));
        var token = new JwtSecurityToken(
            issuer: _jwtConfig.Issuer,
            audience: _jwtConfig.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(Math.Max(_jwtConfig.TokenExpirationInMinutes, 60)),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private Guid ValidateParentToken(string token)
    {
        try
        {
            var result = new JwtSecurityTokenHandler().ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _jwtConfig.Issuer,
                ValidAudience = _jwtConfig.Audience,
                RequireExpirationTime = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtConfig.Secret)),
                ClockSkew = TimeSpan.FromMinutes(1)
            }, out _);

            var tokenType = result.FindFirst(TokenTypeClaim)?.Value;
            if (tokenType != ParentTokenType)
                throw new ApiException(ParentErrors.InvalidToken);

            var idValue = result.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(idValue, out var studentId))
                throw new ApiException(ParentErrors.InvalidToken);

            return studentId;
        }
        catch (ApiException)
        {
            throw;
        }
        catch
        {
            throw new ApiException(ParentErrors.InvalidToken);
        }
    }

    private static string NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return string.Empty;

        var digits = Regex.Replace(phone, @"[^\d]", "");

        if (digits.StartsWith("0020") && digits.Length > 4)
            digits = digits[4..];
        else if (digits.StartsWith("20") && digits.Length > 10)
            digits = digits[2..];

        if (digits.StartsWith("0") == false && digits.Length == 10)
            digits = "0" + digits;

        return digits;
    }
}
