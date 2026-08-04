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
            query.Called);

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
                FullName = student.FullName,
                PhoneNumber = student.PhoneNumber,
                ParentPhoneNumber = student.ParentPhoneNumber,
                Attended = attendanceRow is { AttendedAt: not null },
                HomeworkScore = student.LectureHomeworks.FirstOrDefault()?.Score,
                ChooseHomeworkScore = student.LectureChooseHomeworks.FirstOrDefault()?.Score,
                QuizScore = student.LectureQuizzes.FirstOrDefault()?.Score,
                Comment = callLog?.Comment,
                Called = callLog?.Called ?? false,
                CalledAt = callLog?.CalledAt
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
            query.Called);

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

                return new ExportCallCenterStudentRow
                {
                    StudentCode = student.StudentCode,
                    FullName = student.FullName,
                    ParentPhoneNumber = student.ParentPhoneNumber,
                    PhoneNumber = student.PhoneNumber,
                    Attendance = attended ? "Present" : "Absent",
                    HomeworkScore = student.LectureHomeworks.FirstOrDefault()?.Score.ToString(),
                    ChooseHomeworkScore = student.LectureChooseHomeworks.FirstOrDefault()?.Score.ToString(),
                    QuizScore = student.LectureQuizzes.FirstOrDefault()?.Score.ToString(),
                    Comment = callLog?.Comment,
                    Called = callLog?.Called == true ? "Yes" : "No",
                    CalledAt = callLog?.CalledAt?.ToString("u")
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
            FullName = student.FullName,
            PhoneNumber = student.PhoneNumber,
            ParentPhoneNumber = student.ParentPhoneNumber,
            Attended = attendanceRow is { AttendedAt: not null },
            HomeworkScore = student.LectureHomeworks.FirstOrDefault()?.Score,
            ChooseHomeworkScore = student.LectureChooseHomeworks.FirstOrDefault()?.Score,
            QuizScore = student.LectureQuizzes.FirstOrDefault()?.Score,
            Comment = callLog.Comment,
            Called = callLog.Called,
            CalledAt = callLog.CalledAt
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

    private IQueryable<Student> BuildStudentsQuery(
        StudentLevel? level,
        Guid lectureId,
        string? search,
        string? attendance,
        string? called)
    {
        search = search?.Trim().ToLower();
        attendance = attendance?.Trim().ToLowerInvariant();
        called = called?.Trim().ToLowerInvariant();

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

        return studentsQuery;
    }
}
