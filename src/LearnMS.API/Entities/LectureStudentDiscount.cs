namespace LearnMS.API.Entities;

public class LectureStudentDiscount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid StudentId { get; set; }
    public Student? Student { get; set; }
    public required Guid LectureId { get; set; }
    public Lecture? Lecture { get; set; }

    /// <summary>Percent off this lecture, from just above 0 through 100.</summary>
    public required decimal Percentage { get; set; }

    public required DiscountTarget AppliesTo { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
