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

        var search = query.Search?.Trim().ToLower();
        var attendance = query.Attendance?.Trim().ToLowerInvariant();

        var studentsQuery = db.Students
            .AsNoTracking()
            .Where(x => x.Level == lecture.Course.Level)
            .Include(x => x.LectureHomeworks.Where(h => h.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureChooseHomeworks.Where(h => h.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureQuizzes.Where(q => q.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureAttendances.Where(a => a.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureStudentCallLogs.Where(c => c.LectureId == query.LectureId).Take(1))
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
                x.LectureAttendances.Any(a => a.LectureId == query.LectureId && a.AttendedAt != null));
        }
        else if (attendance is "absent")
        {
            studentsQuery = studentsQuery.Where(x =>
                !x.LectureAttendances.Any(a => a.LectureId == query.LectureId && a.AttendedAt != null));
        }

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

        var search = query.Search?.Trim().ToLower();
        var attendance = query.Attendance?.Trim().ToLowerInvariant();

        var studentsQuery = db.Students
            .AsNoTracking()
            .Where(x => x.Level == lecture.Course.Level)
            .Include(x => x.LectureHomeworks.Where(h => h.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureChooseHomeworks.Where(h => h.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureQuizzes.Where(q => q.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureAttendances.Where(a => a.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureStudentCallLogs.Where(c => c.LectureId == query.LectureId).Take(1))
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
                x.LectureAttendances.Any(a => a.LectureId == query.LectureId && a.AttendedAt != null));
        }
        else if (attendance is "absent")
        {
            studentsQuery = studentsQuery.Where(x =>
                !x.LectureAttendances.Any(a => a.LectureId == query.LectureId && a.AttendedAt != null));
        }

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

        if (callLog is null)
        {
            callLog = new LectureStudentCallLog
            {
                LectureId = command.LectureId,
                StudentId = command.StudentId,
                Comment = command.Comment?.Trim(),
                Called = command.Called ?? false,
                CalledAt = command.Called == true ? DateTime.UtcNow : null,
                UpdatedBy = command.ActorId,
                UpdatedAt = DateTime.UtcNow
            };
            await db.Set<LectureStudentCallLog>().AddAsync(callLog);
        }
        else
        {
            if (command.Comment is not null)
                callLog.Comment = command.Comment.Trim();

            if (command.Called is { } called)
            {
                callLog.Called = called;
                callLog.CalledAt = called ? (callLog.CalledAt ?? DateTime.UtcNow) : null;
            }

            callLog.UpdatedBy = command.ActorId;
            callLog.UpdatedAt = DateTime.UtcNow;
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
}
