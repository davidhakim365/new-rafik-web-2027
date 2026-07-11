using LearnMS.API.Common;
using LearnMS.API.Features.Courses;
using LearnMS.API.Features.Profile;
using Microsoft.AspNetCore.Identity;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace LearnMS.API.Entities;

[Newtonsoft.Json.JsonConverter(typeof(StringEnumConverter))]
public enum StudentLevel
{
    Level0,
    Level1,
    Level2,
    Level3
}

public class Student : User
{
    public required string FullName { get; set; }
    public required string PhoneNumber { get; set; }
    public required string ParentPhoneNumber { get; set; }
    public required string StudentCode { get; set; }
    public string? DeviceKey { get; set; }
    public required string SchoolName { get; set; }
    public required StudentLevel Level { get; set; }

    public List<Course> PurchasedCourses { get; } = [];
    public List<CourseEnrollment> CourseEnrollments { get; } = [];
    public List<Lecture> PurchasedLectures { get; } = [];
    public List<LectureEnrollment> LectureEnrollments { get; } = [];
    public List<LectureHomework> LectureHomeworks { get; } = [];
    public List<LectureQuiz> LectureQuizzes { get; } = [];
    public List<LectureAttendance> LectureAttendances { get; } = [];
    public List<Exam> PurchasedExams { get; } = [];
    public List<ExamEnrollment> ExamEnrollments { get; } = [];

    public List<Quiz> SubmittedQuizzes { get; } = [];
    public List<QuizSubmission> QuizSubmissions { get; } = [];

    public List<Lesson> AttendedLessons { get; } = [];
    public List<LessonAttendance> LessonAttendances { get; } = [];

    private decimal _credit = 0; // DON'T CHANGE THE NAME

    public decimal Credit => _credit;

    public void AddCredit(Guid? assistantId, decimal amount, out StudentCredit studentCredit)
    {
        _credit += amount;
        studentCredit = new StudentCredit
        {
            AssistantId = assistantId,
            StudentId = Id,
            Value = amount
        };

        Events.Add(
            new StudentEvent
            {
                Message =
                    assistantId == null
                        ? $"Credited {amount} LE by Teacher"
                        : $"Credited {amount} LE by Assistant {assistantId}"
            }
        );
    }

    public void RedeemCode(CreditCode code, out CreditCode redeemedCode)
    {
        _credit += code.Value;
        redeemedCode = code;
        redeemedCode.StudentId = Id;

        Events.Add(
            new StudentEvent { Message = $"Redeemed credit code {code.Code} for {code.Value} LE" }
        );
    }

    public void BuyOrRenewCourse(Course course)
    {
        var courseEnrollment = course.CourseEnrollments.FirstOrDefault(x => x.StudentId == Id);

        if (courseEnrollment?.ExpiresAt > DateTime.UtcNow)
            throw new ApiException(CoursesErrors.AlreadyPurchased);

        if (courseEnrollment != null)
        {
            if (_credit < course.RenewalPrice)
                throw new ApiException(ProfileErrors.InsufficientCredits);
            _credit -= course.RenewalPrice ?? 0;
            courseEnrollment.ExpiresAt = DateTime.UtcNow.AddDays(course.ExpirationDays ?? 0);
            Events.Add(
                new StudentEvent()
                {
                    Message = $"Course {course.Title} renewed for {course.RenewalPrice} LE"
                }
            );
        }
        else
        {
            if (_credit < course.Price)
                throw new ApiException(ProfileErrors.InsufficientCredits);
            _credit -= course.Price ?? 0;
            course.CourseEnrollments.Add(
                new CourseEnrollment
                {
                    ExpiresAt = DateTime.UtcNow.AddDays(course.ExpirationDays ?? 0),
                    StudentId = Id
                }
            );
            Events.Add(
                new StudentEvent()
                {
                    Message = $"Course {course.Title} purchased for {course.Price} LE"
                }
            );
        }
    }

    public void BuyOrRenewLecture(Course course, Lecture lecture)
    {
        if (course.CourseEnrollments.Any(x => x.StudentId == Id && x.ExpiresAt > DateTime.UtcNow))
            throw new ApiException(CoursesErrors.AlreadyPurchased);

        var lectureEnrollment = lecture.LectureEnrollments.FirstOrDefault(x => x.StudentId == Id);

        if (lectureEnrollment?.ExpiresAt > DateTime.UtcNow)
            throw new ApiException(LecturesErrors.AlreadyPurchased);

        if (lectureEnrollment != null)
        {
            if (_credit < lecture.RenewalPrice)
                throw new ApiException(ProfileErrors.InsufficientCredits);
            _credit -= lecture.RenewalPrice ?? 0;
            lectureEnrollment.ExpiresAt = DateTime.UtcNow.AddDays(lecture.ExpirationDays ?? 0);
            Events.Add(
                new StudentEvent()
                {
                    Message = $"Lecture {lecture.Title} renewed for  {lecture.RenewalPrice} LE"
                }
            );
        }
        else
        {
            if (_credit < lecture.Price)
                throw new ApiException(ProfileErrors.InsufficientCredits);
            _credit -= lecture.Price ?? 0;
            lecture.LectureEnrollments.Add(
                new LectureEnrollment
                {
                    ExpiresAt = DateTime.UtcNow.AddDays(lecture.ExpirationDays ?? 0),
                    StudentId = Id
                }
            );
            Events.Add(
                new StudentEvent()
                {
                    Message = $"Lecture {lecture.Title} purchased for  {lecture.Price} LE"
                }
            );
        }
    }

    public void BuyOrRetakeExam(Exam exam)
    {
        var enrollment = ExamEnrollments.FirstOrDefault(x =>
            x.StudentId == Id && x.ExamId == exam.Id
        );

        if (
            enrollment != null
            && enrollment.Submission == null
            && enrollment.ExpiresAt > DateTime.UtcNow
        )
            throw new ApiException(ExamsErrors.AlreadyPurchased);

        if (enrollment == null)
        {
            if (_credit < exam.Price)
                throw new ApiException(ProfileErrors.InsufficientCredits);
            _credit -= exam.Price;
            ExamEnrollments.Add(
                new ExamEnrollment
                {
                    ExamId = exam.Id,
                    StudentId = Id,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(exam.ExpiryHours)
                }
            );
            Events.Add(
                new StudentEvent() { Message = $"Exam {exam.Title} purchased for {exam.Price} LE" }
            );
        }
        else
        {
            if (_credit < exam.RetakePrice)
                throw new ApiException(ProfileErrors.InsufficientCredits);
            _credit -= exam.RetakePrice;
            enrollment.Submission = null;
            enrollment.ExpiresAt = DateTime.UtcNow.AddMinutes(exam.ExpiryHours);
            Events.Add(
                new StudentEvent() { Message = $"Exam {exam.Title} retaken for {exam.RetakePrice} LE" }
            );
        }
    }

    public void RenewLesson(Lesson lesson)
    {
        var attendance =
            lesson.LessonAttendances.FirstOrDefault(x => x.StudentId == Id)
            ?? throw new ApiException(LessonsErrors.NotStarted);
        if (attendance.ExpirationDate > DateTime.UtcNow)
            throw new ApiException(LessonsErrors.AlreadyRenewed);
        if (_credit < lesson.RenewalPrice)
            throw new ApiException(ProfileErrors.InsufficientCredits);
        _credit -= lesson.RenewalPrice;
        attendance.ExpirationDate = DateTime.UtcNow.AddHours(lesson.ExpirationHours);
        Events.Add(
            new StudentEvent()
            {
                Message = $"Lesson {lesson.Title} renewed for {lesson.RenewalPrice} LE"
            }
        );
    }

    public static Student Register(
        Account account,
        string fullName,
        string phoneNumber,
        string parentPhoneNumber,
        string studentCode,
        string schoolName,
        StudentLevel level
    )
    {
        var id = Guid.NewGuid();

        account.Id = id;

        return new Student
        {
            Id = id,
            FullName = fullName,
            PhoneNumber = phoneNumber,
            ParentPhoneNumber = parentPhoneNumber,
            StudentCode = studentCode,
            Level = level,
            SchoolName = schoolName,
            Accounts = new List<Account>() { account }
        };
    }

    private Student() { }

    public List<StudentEvent> Events { get; } = new();
}

public sealed class StudentEvent
{
    public Guid Id { get; init; }
    public Guid StudentId { get; init; }
    public Student Student { get; } = null!;
    public required string Message { get; set; } = null!;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
