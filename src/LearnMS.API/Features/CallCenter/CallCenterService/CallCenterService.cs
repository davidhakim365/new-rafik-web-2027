using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.CallCenter.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.CallCenter;

public sealed class CallCenterService(AppDbContext db) : ICallCenterService
{
    public async Task<PageList<CallCenterStudentDto>> QueryAsync(GetCallCenterStudentsQuery query)
    {
        var lecture = await db.Lectures
            .AsNoTracking()
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == query.LectureId)
            ?? throw new ApiException(CallCenterErrors.LectureNotFound);

        if (lecture.CourseId != query.CourseId)
            throw new ApiException(CallCenterErrors.LectureCourseMismatch);

        var studentsQuery = BuildStudentsQuery(
            lecture.Course.Level,
            query.LectureId,
            query.Search,
            query.Attendance,
            query.Called,
            query.StudyMode);

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 200);
        var students = await PageList<Student>.CreateAsync(studentsQuery, page, pageSize);

        var items = students.Items.Select(student =>
        {
            var attendanceRow = student.LectureAttendances.FirstOrDefault();
            var callLog = student.LectureStudentCallLogs.FirstOrDefault();

            return new CallCenterStudentDto
            {
                Id = student.Id,
                StudentCode = student.StudentCode,
                StudyMode = ResolveStudyMode(student.StudentCode),
                FullName = student.FullName,
                PhoneNumber = student.PhoneNumber,
                ParentPhoneNumber = student.ParentPhoneNumber,
                Attended = attendanceRow is { AttendedAt: not null },
                HomeworkScore = student.LectureHomeworks.FirstOrDefault()?.Score,
                ChooseHomeworkScore = student.LectureChooseHomeworks.FirstOrDefault()?.Score,
                QuizScore = student.LectureQuizzes.FirstOrDefault()?.Score,
                Comment = callLog?.Comment,
                Called = callLog?.Called ?? false,
                CalledAt = callLog?.CalledAt,
                IsBlocked = student.IsBlocked
            };
        }).ToList();

        return new PageList<CallCenterStudentDto>(
            items,
            students.Page,
            students.PageSize,
            students.TotalCount);
    }

    public async IAsyncEnumerable<List<ExportCallCenterStudentRow>> ExportAsync(
        ExportCallCenterStudentsQuery query)
    {
        var lecture = await db.Lectures
            .AsNoTracking()
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == query.LectureId)
            ?? throw new ApiException(CallCenterErrors.LectureNotFound);

        if (lecture.CourseId != query.CourseId)
            throw new ApiException(CallCenterErrors.LectureCourseMismatch);

        var studentsQuery = BuildStudentsQuery(
            lecture.Course.Level,
            query.LectureId,
            query.Search,
            query.Attendance,
            query.Called,
            query.StudyMode);

        const int chunkSize = 200;
        var total = await studentsQuery.CountAsync();
        for (var i = 0; i * chunkSize < total; i++)
        {
            var chunk = await studentsQuery
                .Skip(i * chunkSize)
                .Take(chunkSize)
                .ToListAsync();

            yield return chunk.Select(student =>
            {
                var attendanceRow = student.LectureAttendances.FirstOrDefault();
                var callLog = student.LectureStudentCallLogs.FirstOrDefault();
                var attended = attendanceRow is { AttendedAt: not null };
                var studyMode = ResolveStudyMode(student.StudentCode);

                return new ExportCallCenterStudentRow
                {
                    StudentCode = student.StudentCode,
                    StudyMode = studyMode == "online" ? "Online" : "Offline",
                    FullName = student.FullName,
                    ParentPhoneNumber = student.ParentPhoneNumber,
                    PhoneNumber = student.PhoneNumber,
                    Attendance = attended ? "Present" : "Absent",
                    HomeworkScore = student.LectureHomeworks.FirstOrDefault()?.Score.ToString(),
                    ChooseHomeworkScore = student.LectureChooseHomeworks.FirstOrDefault()?.Score.ToString(),
                    QuizScore = student.LectureQuizzes.FirstOrDefault()?.Score.ToString(),
                    Comment = callLog?.Comment,
                    Called = callLog?.Called == true ? "Yes" : "No",
                    CalledAt = callLog?.CalledAt?.ToString("u"),
                    IsBlocked = student.IsBlocked ? "Yes" : "No"
                };
            }).ToList();
        }
    }

    public async Task<CallCenterStudentDto> ExecuteAsync(UpsertCallCenterStudentCommand command)
    {
        var lecture = await db.Lectures
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == command.LectureId)
            ?? throw new ApiException(CallCenterErrors.LectureNotFound);

        if (lecture.CourseId != command.CourseId)
            throw new ApiException(CallCenterErrors.LectureCourseMismatch);

        var student = await db.Students
            .Include(x => x.LectureHomeworks.Where(h => h.LectureId == command.LectureId).Take(1))
            .Include(x => x.LectureChooseHomeworks.Where(h => h.LectureId == command.LectureId).Take(1))
            .Include(x => x.LectureQuizzes.Where(q => q.LectureId == command.LectureId).Take(1))
            .Include(x => x.LectureAttendances.Where(a => a.LectureId == command.LectureId).Take(1))
            .FirstOrDefaultAsync(x => x.Id == command.StudentId)
            ?? throw new ApiException(CallCenterErrors.StudentNotFound);

        var callLog = await db.Set<LectureStudentCallLog>()
            .FirstOrDefaultAsync(x => x.LectureId == command.LectureId && x.StudentId == command.StudentId);

        var previousComment = callLog?.Comment;
        var previousCalled = callLog?.Called ?? false;
        var commentProvided = command.Comment is not null;
        var nextComment = commentProvided ? command.Comment!.Trim() : previousComment;
        var nextCalled = command.Called ?? previousCalled;

        if (callLog is null)
        {
            callLog = new LectureStudentCallLog
            {
                LectureId = command.LectureId,
                StudentId = command.StudentId,
                Comment = nextComment,
                Called = nextCalled,
                CalledAt = nextCalled ? DateTime.UtcNow : null,
                UpdatedBy = command.ActorId,
                UpdatedAt = DateTime.UtcNow
            };
            await db.Set<LectureStudentCallLog>().AddAsync(callLog);
        }
        else
        {
            if (commentProvided)
                callLog.Comment = nextComment;

            if (command.Called is { } called)
            {
                callLog.Called = called;
                callLog.CalledAt = called ? (callLog.CalledAt ?? DateTime.UtcNow) : null;
            }

            callLog.UpdatedBy = command.ActorId;
            callLog.UpdatedAt = DateTime.UtcNow;
        }

        var previousNormalized = string.IsNullOrWhiteSpace(previousComment)
            ? null
            : previousComment.Trim();
        var nextNormalized = string.IsNullOrWhiteSpace(nextComment)
            ? null
            : nextComment;
        var commentChanged = commentProvided &&
            !string.Equals(previousNormalized, nextNormalized, StringComparison.Ordinal);
        var markedCalled = command.Called == true && previousCalled == false;

        var shouldLogCall =
            command.ActorId is not null &&
            (markedCalled || (commentChanged && nextNormalized is not null));

        if (shouldLogCall)
        {
            await db.CallCenterActions.AddAsync(new CallCenterAction
            {
                Id = Guid.NewGuid(),
                LectureId = command.LectureId,
                StudentId = command.StudentId,
                ActorId = command.ActorId!.Value,
                ActionType = CallCenterActionType.Call,
                Comment = nextNormalized,
                CreatedAt = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync();

        var attendanceRow = student.LectureAttendances.FirstOrDefault();
        return new CallCenterStudentDto
        {
            Id = student.Id,
            StudentCode = student.StudentCode,
            StudyMode = ResolveStudyMode(student.StudentCode),
            FullName = student.FullName,
            PhoneNumber = student.PhoneNumber,
            ParentPhoneNumber = student.ParentPhoneNumber,
            Attended = attendanceRow is { AttendedAt: not null },
            HomeworkScore = student.LectureHomeworks.FirstOrDefault()?.Score,
            ChooseHomeworkScore = student.LectureChooseHomeworks.FirstOrDefault()?.Score,
            QuizScore = student.LectureQuizzes.FirstOrDefault()?.Score,
            Comment = callLog.Comment,
            Called = callLog.Called,
            CalledAt = callLog.CalledAt,
            IsBlocked = student.IsBlocked
        };
    }

    public async Task<SetCallCenterStudentBlockedResult> ExecuteAsync(
        SetCallCenterStudentBlockedCommand command)
    {
        var student = await db.Students
            .FirstOrDefaultAsync(x => x.Id == command.StudentId)
            ?? throw new ApiException(CallCenterErrors.StudentNotFound);

        if (student.IsBlocked == command.IsBlocked)
        {
            return new SetCallCenterStudentBlockedResult
            {
                Id = student.Id,
                FullName = student.FullName,
                StudentCode = student.StudentCode,
                IsBlocked = student.IsBlocked
            };
        }

        student.IsBlocked = command.IsBlocked;
        student.Events.Add(new StudentEvent
        {
            Message = command.IsBlocked
                ? command.ActorId is null
                    ? "Account blocked"
                    : $"Account blocked by assistant {command.ActorId}"
                : command.ActorId is null
                    ? "Account unblocked"
                    : $"Account unblocked by assistant {command.ActorId}"
        });

        db.Update(student);
        await db.SaveChangesAsync();

        return new SetCallCenterStudentBlockedResult
        {
            Id = student.Id,
            FullName = student.FullName,
            StudentCode = student.StudentCode,
            IsBlocked = student.IsBlocked
        };
    }

    public async Task ExecuteAsync(RecordCallCenterNotifyCommand command)
    {
        var lecture = await db.Lectures
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == command.LectureId)
            ?? throw new ApiException(CallCenterErrors.LectureNotFound);

        if (lecture.CourseId != command.CourseId)
            throw new ApiException(CallCenterErrors.LectureCourseMismatch);

        var studentExists = await db.Students.AnyAsync(x => x.Id == command.StudentId);
        if (!studentExists)
            throw new ApiException(CallCenterErrors.StudentNotFound);

        var comment = string.IsNullOrWhiteSpace(command.Comment)
            ? null
            : command.Comment.Trim();

        await db.CallCenterActions.AddAsync(new CallCenterAction
        {
            Id = Guid.NewGuid(),
            LectureId = command.LectureId,
            StudentId = command.StudentId,
            ActorId = command.ActorId,
            ActionType = CallCenterActionType.Notify,
            Comment = comment,
            CreatedAt = DateTime.UtcNow
        });

        // Keep latest comment on the summary call-log row when notify includes one.
        if (comment is not null)
        {
            var callLog = await db.Set<LectureStudentCallLog>()
                .FirstOrDefaultAsync(x =>
                    x.LectureId == command.LectureId && x.StudentId == command.StudentId);

            if (callLog is null)
            {
                await db.Set<LectureStudentCallLog>().AddAsync(new LectureStudentCallLog
                {
                    LectureId = command.LectureId,
                    StudentId = command.StudentId,
                    Comment = comment,
                    Called = false,
                    UpdatedBy = command.ActorId,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                callLog.Comment = comment;
                callLog.UpdatedBy = command.ActorId;
                callLog.UpdatedAt = DateTime.UtcNow;
            }
        }

        await db.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<CallCenterHistoryItemDto>> QueryAsync(GetCallCenterHistoryQuery query)
    {
        var lecture = await db.Lectures
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == query.LectureId)
            ?? throw new ApiException(CallCenterErrors.LectureNotFound);

        if (lecture.CourseId != query.CourseId)
            throw new ApiException(CallCenterErrors.LectureCourseMismatch);

        var actions = await db.CallCenterActions
            .AsNoTracking()
            .Where(x => x.LectureId == query.LectureId && x.StudentId == query.StudentId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();

        if (actions.Count == 0)
            return Array.Empty<CallCenterHistoryItemDto>();

        var actorIds = actions.Select(x => x.ActorId).Distinct().ToList();

        var assistantNames = await db.Assistants
            .AsNoTracking()
            .Where(x => actorIds.Contains(x.Id))
            .Select(x => new { x.Id, x.FullName })
            .ToDictionaryAsync(x => x.Id, x => x.FullName);

        var accountEmails = await db.Accounts
            .AsNoTracking()
            .Where(x => actorIds.Contains(x.Id))
            .Select(x => new { x.Id, x.Email })
            .ToDictionaryAsync(x => x.Id, x => x.Email);

        return actions.Select(action =>
        {
            string actorName;
            if (assistantNames.TryGetValue(action.ActorId, out var fullName) &&
                !string.IsNullOrWhiteSpace(fullName))
            {
                actorName = fullName;
            }
            else if (accountEmails.TryGetValue(action.ActorId, out var email) &&
                     !string.IsNullOrWhiteSpace(email))
            {
                actorName = email;
            }
            else
            {
                actorName = "Unknown";
            }

            return new CallCenterHistoryItemDto
            {
                Id = action.Id,
                ActionType = action.ActionType.ToString(),
                Comment = action.Comment,
                ActorId = action.ActorId,
                ActorName = actorName,
                CreatedAt = action.CreatedAt
            };
        }).ToList();
    }

    public async Task<CallCenterStudentLecturesResult> QueryAsync(GetCallCenterStudentLecturesQuery query)
    {
        var lecture = await db.Lectures
            .AsNoTracking()
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == query.LectureId)
            ?? throw new ApiException(CallCenterErrors.LectureNotFound);

        if (lecture.CourseId != query.CourseId)
            throw new ApiException(CallCenterErrors.LectureCourseMismatch);

        var student = await db.Students
            .AsNoTracking()
            .Select(s => new { s.Id, s.Level })
            .FirstOrDefaultAsync(x => x.Id == query.StudentId)
            ?? throw new ApiException(CallCenterErrors.StudentNotFound);

        var items = await db.Lectures
            .AsNoTracking()
            .Where(l => l.Course.IsPublished && l.Course.Level == student.Level)
            .Select(l => new CallCenterStudentLectureDto
            {
                Id = l.Id,
                CourseId = l.CourseId,
                CourseTitle = l.Course.Title,
                Title = l.Title,
                Order = l.Order,
                IsCurrent = l.Id == query.LectureId,
                Attended = l.LectureAttendances
                    .Any(a => a.StudentId == query.StudentId && a.AttendedAt != null),
                CenterName = l.LectureAttendances
                    .Where(a => a.StudentId == query.StudentId && a.AttendedAt != null)
                    .Select(a => a.Center != null ? a.Center.Name : null)
                    .FirstOrDefault(),
                HomeworkScore = l.LectureHomeworks
                    .Where(h => h.StudentId == query.StudentId)
                    .Select(h => (decimal?)h.Score)
                    .FirstOrDefault(),
                HomeworkFullMark = l.HomeworkFullMark,
                ChooseHomeworkScore = l.LectureChooseHomeworks
                    .Where(h => h.StudentId == query.StudentId)
                    .Select(h => (decimal?)h.Score)
                    .FirstOrDefault(),
                ChooseHomeworkFullMark = l.ChooseHomeworkFullMark,
                QuizScore = l.LectureQuizzes
                    .Where(q => q.StudentId == query.StudentId)
                    .Select(q => (decimal?)q.Score)
                    .FirstOrDefault(),
                QuizFullMark = l.QuizFullMark,
                StudentQuizzesScore = l.Quizzes
                    .Sum(q => q.QuizSubmissions
                        .Where(sub => sub.StudentId == query.StudentId)
                        .Select(sub => (decimal?)sub.NumOfCorrect)
                        .FirstOrDefault()),
                TotalQuizzesScore = l.Quizzes
                    .Sum(q => q.QuizSubmissions
                        .Where(sub => sub.StudentId == query.StudentId)
                        .Select(sub => (decimal?)sub.NumOfQuestions)
                        .FirstOrDefault()),
                EnrollmentStatus = l.LectureEnrollments
                    .Where(e => e.StudentId == query.StudentId)
                    .Select(e => e.ExpiresAt >= DateTime.UtcNow ? "Active" : "Expired")
                    .FirstOrDefault() ?? "NotEnrolled",
                Called = l.LectureStudentCallLogs
                    .Any(c => c.StudentId == query.StudentId && c.Called),
                Comment = l.LectureStudentCallLogs
                    .Where(c => c.StudentId == query.StudentId)
                    .Select(c => c.Comment)
                    .FirstOrDefault()
            })
            .ToListAsync();

        items = items
            .OrderBy(x => x.CourseId == query.CourseId ? 0 : 1)
            .ThenBy(x => x.CourseTitle)
            .ThenBy(x => x.Order)
            .ThenBy(x => x.Title)
            .ToList();

        return new CallCenterStudentLecturesResult
        {
            Items = items,
            PresentCount = items.Count(x => x.Attended),
            AbsentCount = items.Count(x => !x.Attended),
            TotalCount = items.Count
        };
    }

    private static string ResolveStudyMode(string? studentCode)
    {
        return IsOnlineStudentCode(studentCode) ? "online" : "offline";
    }

    private static bool IsOnlineStudentCode(string? studentCode)
    {
        return !string.IsNullOrWhiteSpace(studentCode) &&
               studentCode.StartsWith("ONL-", StringComparison.OrdinalIgnoreCase);
    }

    private IQueryable<Student> BuildStudentsQuery(
        StudentLevel? level,
        Guid lectureId,
        string? search,
        string? attendance,
        string? called,
        string? studyMode)
    {
        search = search?.Trim().ToLower();
        attendance = attendance?.Trim().ToLowerInvariant();
        called = called?.Trim().ToLowerInvariant();
        studyMode = studyMode?.Trim().ToLowerInvariant();

        var studentsQuery = db.Students
            .AsNoTracking()
            .Where(x => x.Level == level)
            .Include(x => x.LectureHomeworks.Where(h => h.LectureId == lectureId).Take(1))
            .Include(x => x.LectureChooseHomeworks.Where(h => h.LectureId == lectureId).Take(1))
            .Include(x => x.LectureQuizzes.Where(q => q.LectureId == lectureId).Take(1))
            .Include(x => x.LectureAttendances.Where(a => a.LectureId == lectureId).Take(1))
            .Include(x => x.LectureStudentCallLogs.Where(c => c.LectureId == lectureId).Take(1))
            .OrderBy(x => x.StudentCode)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            studentsQuery = studentsQuery.Where(x =>
                x.FullName.ToLower().Contains(search) ||
                x.StudentCode.ToLower().Contains(search) ||
                x.ParentPhoneNumber.Contains(search) ||
                x.PhoneNumber.Contains(search));
        }

        if (attendance is "present")
        {
            studentsQuery = studentsQuery.Where(x =>
                x.LectureAttendances.Any(a => a.LectureId == lectureId && a.AttendedAt != null));
        }
        else if (attendance is "absent")
        {
            studentsQuery = studentsQuery.Where(x =>
                !x.LectureAttendances.Any(a => a.LectureId == lectureId && a.AttendedAt != null));
        }

        if (called is "called" or "yes" or "true")
        {
            studentsQuery = studentsQuery.Where(x =>
                x.LectureStudentCallLogs.Any(c => c.LectureId == lectureId && c.Called));
        }
        else if (called is "not-called" or "notcalled" or "no" or "false")
        {
            studentsQuery = studentsQuery.Where(x =>
                !x.LectureStudentCallLogs.Any(c => c.LectureId == lectureId && c.Called));
        }

        if (studyMode is "online")
        {
            studentsQuery = studentsQuery.Where(x =>
                x.StudentCode.ToUpper().StartsWith("ONL-"));
        }
        else if (studyMode is "offline")
        {
            studentsQuery = studentsQuery.Where(x =>
                !x.StudentCode.ToUpper().StartsWith("ONL-"));
        }

        return studentsQuery;
    }
}
