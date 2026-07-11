namespace LearnMS.API.Entities;

public sealed class Course
{
    public Guid Id { get; init; }
    public required string Title { get; set; }
    public string? Description { get; set; }= ".";
    public string? ImageUrl { get; set; }= ".";
    public decimal? Price { get; set; } = 360;
    public decimal? RenewalPrice { get; set; } =360;
    public StudentLevel? Level { get; set; } =StudentLevel.Level3;

    public List<Lecture> Lectures { get; } = [];
    public List<Exam> Exams { get; } = [];

    public List<Student> EnrolledStudents { get; } = [];
    public List<CourseEnrollment> CourseEnrollments { get; } = [];

    public int? ExpirationDays { get; set; } =7;

    public bool IsPublished { get; set; } = false;

    public void AddItem(Lecture lecture)
    {
        lecture.Order = Lectures.Count + Exams.Count + 1;
        Lectures.Add(lecture);
    }

    public void AddItem(Exam exam)
    {
        exam.Order = Lectures.Count + Exams.Count + 1;
        Exams.Add(exam);
    }

    public void RemoveItem(Guid itemId)
    {
        Exams.RemoveAll(x => x.Id == itemId);
        Lectures.RemoveAll(x => x.Id == itemId);
        var combinedItems = Exams.Cast<IOrdered>().Union(Lectures).OrderBy(x => x.Order).ToList();
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
            if (Price == null) return false;
            if (RenewalPrice == null) return false;
            if (Level == null) return false;
            if (ExpirationDays == null) return false;
            return true;
        }
    }

}
