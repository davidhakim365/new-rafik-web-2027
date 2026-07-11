namespace LearnMS.API.Entities;

public class Lecture : IOrdered
{
    public const string BasePath = "lectures";
    public Guid Id { get; set; }
    public int Order { get; set; }
    public required string Title { get; set; }

    public string? Description { get; set; } =
        @" *HomeWork*

El-Moasser Book :

__________________

*Choose*

HW:

Choose Form : 

__________________

*Essay*

HW:

Essay Form :

__________________

Homework Video :

";

    public string? ImageUrl { get; set; } = ".";

    public decimal? Price { get; set; } = 90;
    public decimal? RenewalPrice { get; set; } = 90;
    public int? ExpirationDays { get; set; } = 7;
    public bool IsPublished = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Student> EnrolledStudents { get; } = [];
    public List<LectureEnrollment> LectureEnrollments { get; } = [];
    public List<LectureHomework> LectureHomeworks { get; } = [];
    public List<LectureQuiz> LectureQuizzes { get; } = [];

    public List<LectureAttendance> LectureAttendances { get; } = [];

    public List<Quiz> Quizzes { get; } = [];
    public List<Lesson> Lessons { get; } = [];
    public Guid CourseId { get; init; }
    public Course Course { get; } = null!;

    public List<Asset> Assets = [];
    public List<LectureAsset> LectureAssets = [];

    public void AddItem(Lesson lesson)
    {
        lesson.Order = Lessons.Count + Quizzes.Count + 1;
        Lessons.Add(lesson);
    }

    public void AddItem(Quiz quiz)
    {
        quiz.Order = Lessons.Count + Quizzes.Count + 1;
        Quizzes.Add(quiz);
    }

    // also restore lessons and quizzes order via order property
    public void RemoveItem(Guid itemId)
    {
        Quizzes.RemoveAll(x => x.Id == itemId);
        Lessons.RemoveAll(x => x.Id == itemId);
        var combinedItems = Quizzes.Cast<IOrdered>().Union(Lessons).OrderBy(x => x.Order).ToList();
        for (int i = 0; i < combinedItems.Count; i++)
        {
            combinedItems[i].Order = i;
        }
    }

    public bool IsPublishable
    {
        get
        {
            if (string.IsNullOrWhiteSpace(Title)) return false;
            if (string.IsNullOrWhiteSpace(Description)) return false;
            if (string.IsNullOrWhiteSpace(ImageUrl)) return false;
            if (Price is null) return false;
            if (RenewalPrice is null) return false;
            if (ExpirationDays == null) return false;
            return true;
        }
    }

    public bool IsImportant { get; set; } = false;
}

public class LectureAsset
{
    public required string AssetId { get; init; }
    public Asset Asset { get; } = null!;

    public required Guid LectureId { get; init; }
    public Lecture Lecture { get; } = null!;
}
