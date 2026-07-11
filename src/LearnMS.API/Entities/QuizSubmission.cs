using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace LearnMS.API.Entities;

public sealed class QuizSubmission
{

    public required Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public required Guid QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;


    public JsonDocument QuestionSubmissionsJson { get; private set; } = null!;

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

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
