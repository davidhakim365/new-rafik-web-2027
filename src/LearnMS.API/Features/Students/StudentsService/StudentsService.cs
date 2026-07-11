using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using LearnMS.API.Features.Students.Contracts;
using LearnMS.API.Security.PasswordHasher;
using Microsoft.EntityFrameworkCore;
using System.Globalization;



namespace LearnMS.API.Features.Students;

public sealed class StudentsService(AppDbContext db, IPasswordHasher passwordHasher)
    : IStudentsService
{
    public async Task ExecuteAsync(CreateStudentCommand command)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(x =>
            x.Email.ToLower() == command.Email.ToLower()
        );

        if (account != null)
            throw new ApiException(AuthErrors.EmailAlreadyExists);


        var code = await db.Students
            .FirstOrDefaultAsync(x => x.StudentCode == command.StudentCode);

        if (code != null)
        {
            throw new ApiException(AuthErrors.code);
        }

        var passwordHash = passwordHasher.Hash(command.Password.Trim());

        var student = Student.Register(
            new Account
            {
                Email = command.Email.ToLower(),
                PasswordHash = passwordHash,
                Password = command.Password.Trim(),
                ProviderType = ProviderType.Local
            },
            command.FullName,
            command.PhoneNumber,
            command.ParentPhoneNumber,
            command.StudentCode,
            command.School,
            command.Level
        );

        await db.Students.AddAsync(student);
        await db.SaveChangesAsync();
    }

    public async Task ExecuteAsync(AddStudentCreditCommand command)
    {
        var student = await db.Students.FirstOrDefaultAsync(x => x.Id == command.Id);

        if (student is null)
            throw new ApiException(StudentsErrors.NotFound);

        student.AddCredit(command.AssistantId, command.Amount, out var studentCredit);

        await db.AddAsync(studentCredit);
        db.Update(student);
        await db.SaveChangesAsync();
    }

public async Task ExecuteAsync(DeleteStudentCommand command)
{
    var student = await db.Students.FirstOrDefaultAsync(x => x.Id == command.Id);
    if (student is null)
        throw new ApiException(StudentsErrors.NotFound);

    var account = await db.Accounts.FirstOrDefaultAsync(x => x.Id == student.Id);
    if (account is null)
        throw new ApiException(StudentsErrors.NotFound);

    db.Remove(student);
    db.Remove(account);
    
    await db.SaveChangesAsync();
}


    public async Task ExecuteAsync(UpdateStudentCommand command)
    {
        var student =
            await db.Students.Include(x => x.Accounts).FirstOrDefaultAsync(x => x.Id == command.Id)
            ?? throw new ApiException(StudentsErrors.NotFound);

        if (!string.IsNullOrEmpty(command.FullName))
            student.FullName = command.FullName;

        if (!string.IsNullOrEmpty(command.PhoneNumber))
            student.PhoneNumber = command.PhoneNumber;

        if (!string.IsNullOrEmpty(command.ParentPhoneNumber))
            student.ParentPhoneNumber = command.ParentPhoneNumber;
        if (!string.IsNullOrEmpty(command.StudentCode))
            student.StudentCode = command.StudentCode;

        if (!string.IsNullOrEmpty(command.SchoolName))
            student.SchoolName = command.SchoolName;

        if (command.Level is not null)
            student.Level = command.Level.Value;

        if (!string.IsNullOrEmpty(command.Password))
        {
            var account = student
                .Accounts.Where(x => x.ProviderType == ProviderType.Local)
                .FirstOrDefault();
            if (account is not null)
            {
                account.Password = command.Password.Trim();
                account.PasswordHash = passwordHasher.Hash(command.Password.Trim());
                db.Update(account);
            }
        }

        db.Update(student);
        await db.SaveChangesAsync();
    }

    public async Task ExecuteAsync(UnlinkStudentDeviceCommand command)
    {
        var student =
            await db.Set<Student>().FirstOrDefaultAsync(x => x.Id == command.StudentId)
            ?? throw new ApiException(StudentsErrors.NotFound);

        student.DeviceKey = null;

        db.Update(student);
        await db.SaveChangesAsync();
    }

    public async Task<PageList<SingleStudent>> QueryAsync(GetStudentsQuery query)
    {
        string? search = null;
        if (!string.IsNullOrEmpty(query.Search))
            search = query.Search.Trim().ToLower();

        var result =
            from students in db.Set<Student>()
            join accounts in db.Set<Account>() on students.Id equals accounts.Id
            orderby students.StudentCode
            where
                search != null
                    ? students.FullName.ToLower().Contains(search)
                        || accounts.Email.ToLower().Contains(search)
                        || students.StudentCode.Contains(search)
                    : true && query.Level != null
                        ? students.Level == query.Level
                        : true
            select new SingleStudent
            {
                Id = students.Id,
                DeviceLinked = !string.IsNullOrWhiteSpace(students.DeviceKey),
                Email = accounts.Email,
                Credit = students.Credit,
                FullName = students.FullName,
                Level = students.Level,
                ParentPhoneNumber = students.ParentPhoneNumber,
                StudentCode = students.StudentCode,
                PhoneNumber = students.PhoneNumber,
                ProfilePicture = accounts.ProfilePicture,
                SchoolName = students.SchoolName
            };

        return await PageList<SingleStudent>.CreateAsync(
            result,
            query.Page ?? 1,
            query.PageSize ?? 10
        );
    }

    public async Task<GetStudentResult> QueryAsync(GetStudentQuery query)
    {
        var result =
            from students in db.Set<Student>()
            join accounts in db.Set<Account>() on students.Id equals accounts.Id
            where students.Id == query.Id
            select new GetStudentResult
            {
                ProfilePicture = accounts.ProfilePicture,
                FullName = students.FullName,
                Password = accounts.Password,
                Level = students.Level,
                ParentPhoneNumber = students.ParentPhoneNumber,
                StudentCode = students.StudentCode,
                PhoneNumber = students.PhoneNumber,
                SchoolName = students.SchoolName,
                Credit = students.Credit,
                Email = accounts.Email,
                Id = students.Id,
            };
        var student =
            await result.FirstOrDefaultAsync() ?? throw new ApiException(StudentsErrors.NotFound);

        return student;
    }

    public async IAsyncEnumerable<List<ExportStudentsResult>> QueryAsync(ExportStudentsQuery query)
    {
        var chunkSize = 100;
        var totalRecords = await db.Set<Student>()
            .CountAsync(x => query.Level == null || x.Level == query.Level);
        var chunks = (int)Math.Ceiling((double)totalRecords / chunkSize);
        var q = db.Set<Student>().AsNoTracking().OrderBy(x => x.Id).AsQueryable();
        if (query.Level != null)
            q = q.Where(x => x.Level == query.Level);
        for (var i = 0; i < chunks; i++)
        {
            var records = await q.Skip(i * chunkSize)
                .Take(chunkSize)
                .Select(x => new ExportStudentsResult()
                {
                    Id = x.Id,
                    FullName = x.FullName,
                    Email = x.Accounts.First().Email,
                    Code = x.StudentCode,
                    Credits = x.Credit,
                    Level = x.Level,
                    PhoneNumber = x.PhoneNumber,
                    SchoolName = x.SchoolName,
                    ParentPhoneNumber = x.ParentPhoneNumber
                })
                .ToListAsync();
            yield return records;
        }
    }

    public async Task<PageList<SingleStudentEvent>> QueryAsync(GetStudentEventsQuery query)
    {
        var search = query.Search?.Trim().ToLower();

        var events = db.Set<StudentEvent>()
            .AsNoTracking()
            .OrderBy(x => x.CreatedAt)
            .Where(x => x.StudentId == query.StudentId)
            .AsNoTracking();

        if (search != null)
            events = events.Where(x => x.Message.ToLower().Contains(search));

        var result = events.Select(x => new SingleStudentEvent
        {
            CreatedAt = x.CreatedAt,
            Message = x.Message,
            Id = x.Id
        });

        return await PageList<SingleStudentEvent>.CreateAsync(result, query.Page, query.PageSize);
    }
    public async Task<PageList<SingleStudentLecture>> QueryAsync(GetStudentLecturesQuery query)
    {
        // Fetch student details
        var student = await QueryAsync(new GetStudentQuery
        {
            Id = query.StudentId
        });

        // Query lectures based on course level and publication status
    var lecturesQuery = db.Set<Lecture>()
    .Where(l => l.Course.IsPublished && l.Course.Level == student.Level)
    .Select(l => new SingleStudentLecture
    {
        Id = l.Id,
        Title = l.Title,
        CourseId = l.Course.Id,
        CourseTitle = l.Course.Title ?? "Course",
        HomeworkScore = l.LectureHomeworks
            .Where(h => h.StudentId == query.StudentId)
            .Select(h => (decimal?)h.Score)
            .FirstOrDefault(), // Homework score for the student
        QuizScore = l.LectureQuizzes
            .Where(q => q.StudentId == query.StudentId)
            .Select(q => (decimal?)q.Score)
            .FirstOrDefault(), // Quiz score for the student
        TotalQuizzesScore = l.Quizzes
            .Sum(q => q.QuizSubmissions
                .Where(sub => sub.StudentId == query.StudentId)
                .Select(sub => (decimal?)sub.NumOfQuestions)
                .FirstOrDefault()), // Total quiz score for the student
        StudentQuizzesScore = l.Quizzes
            .Sum(q => q.QuizSubmissions
                .Where(sub => sub.StudentId == query.StudentId)
                .Select(sub => (decimal?)sub.NumOfCorrect)
                .FirstOrDefault()), // Correct quiz answers for the student
        Attended = l.LectureAttendances
            .Any(a => a.StudentId == query.StudentId && a.AttendedAt != null)
            || l.Lessons.Any(lesson => lesson.AttendedStudents.Any(s => s.Id == query.StudentId)), // Attendance status
        EnrollmentStatus = l.LectureEnrollments
            .Where(e => e.StudentId == query.StudentId)
            .Select(e => e.ExpiresAt >= DateTime.UtcNow ? "Active" : "Expired")
            .FirstOrDefault() ?? "NotEnrolled" // Enrollment status
    }).OrderBy(c=>c.CourseId).ThenByDescending(l=>l.Title);

if (!string.IsNullOrWhiteSpace(query.Search))
{
    var searchTerm = query.Search.Trim().ToLower();
    lecturesQuery = lecturesQuery.Where(l => l.Title.ToLower().Contains(searchTerm))
                                 .OrderBy(l => l.Title);
}

// Paginate the lectures
var pagedLectures = await PageList<SingleStudentLecture>.CreateAsync(lecturesQuery, query.Page, query.PageSize);

// Return the paginated list of lectures
return new PageList<SingleStudentLecture>(
    pagedLectures.Items,
    pagedLectures.Page,
    pagedLectures.PageSize,
    pagedLectures.TotalCount
);


    }


    public async Task<PageList<SingleStudentExam>> QueryAsync(GetStudentExamsQuery query)
    {
        var exams = db.Set<Exam>()
            .Include(x => x.ExamEnrollments.Where(x => x.StudentId == query.StudentId).Take(1))
            .ThenInclude(x => x.Submission)
            .Where(x => x.Course.IsPublished)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            exams = exams.Where(x => x.Title.ToLower().Contains(search));
        }

        var result = await PageList<Exam>.CreateAsync(exams, query.Page, query.PageSize);

        List<SingleStudentExam> studentExams = new();

        foreach (var exam in result.Items)
        {
            var enrollment = exam.ExamEnrollments.SingleOrDefault();

            studentExams.Add(
                new SingleStudentExam
                {
                    Title = exam.Title,
                    Id = exam.Id,
                    CourseId = exam.CourseId,
                    StudentScore = enrollment?.Submission?.NumOfCorrect,
                    TotalScore = enrollment?.Submission?.NumOfQuestions,
                    SubmittedAt = enrollment?.Submission?.SubmittedAt
                }
            );
        }

        return new PageList<SingleStudentExam>(
            studentExams,
            result.Page,
            result.PageSize,
            result.TotalCount
        );
    }
}
