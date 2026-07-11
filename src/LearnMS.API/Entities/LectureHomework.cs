namespace LearnMS.API.Entities;

public sealed class LectureHomework
{
    public Guid LectureId { get; set; }
    public Lecture Lecture { get; } = null!;
    public Guid StudentId { get; set; }
    public Student Student { get; } = null!;
    public decimal Score { get; set; }
}