using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;
using LearnMS.API.Entities;

public sealed class ExamSubmission
{

    public required Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public required Guid ExamId { get; set; }
    public Exam Exam { get; set; } = null!;


    public JsonDocument QuestionSubmissionsJson { get; set; } = null!;

    [Required]
    [NotMapped]
    public required List<QuestionSubmission> QuestionSubmissions
    {
        get => JsonSerializer.Deserialize<List<QuestionSubmission>>(QuestionSubmissionsJson)!;
        set => QuestionSubmissionsJson = JsonSerializer.SerializeToDocument(value);
    }

    public required int NumOfCorrect { get; set; }
    public required int NumOfQuestions { get; set; }
    public required int PassCount { get; set; }
    public bool IsPassed => NumOfCorrect >= PassCount;

    [JsonIgnore]
    public ExamEnrollment ExamEnrollment { get; set; } = null!;

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
