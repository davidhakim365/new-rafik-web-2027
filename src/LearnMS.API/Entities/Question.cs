using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LearnMS.API.Entities;

public record Question
{
    [NotMapped] public const string BasePath = "questions";

    [Required] public Guid Id { get; set; }
    [Required] public string Text { get; set; } = null!;
    [Required] public string Description { get; set; } = null!;
    public string? Image { get; set; }
    public string? SourceTitle { get; set; }
    public int? SourceIndex { get; set; }
    [Required] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore] public string BodyJson { get; set; } = null!;

    [NotMapped]
    [Required]
    public QuestionBody Body
    {
        get => JsonSerializer.Deserialize<QuestionBody>(BodyJson, QuestionJson.Options)!;
        init => BodyJson = JsonSerializer.Serialize(value, QuestionJson.Options);
    }

    [JsonIgnore] public List<Exam> Exams { get; } = [];
    [JsonIgnore] public List<ExamQuestion> ExamQuestions { get; } = [];

    [JsonIgnore] public List<Quiz> Quizzes { get; } = [];
    [JsonIgnore] public List<QuizQuestion> QuizQuestions { get; } = [];
}

public static class QuestionJson
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        Converters = { new QuestionChoiceListConverter() }
    };
}

public class QuestionChoice
{
    [Required] public required string Id { get; set; }
    public string? Text { get; set; }
    public string? ImageUrl { get; set; }

    public string Display => !string.IsNullOrWhiteSpace(Text) ? Text : (ImageUrl ?? Id);
}

[JsonDerivedType(typeof(MultipleChoiceQuestion), nameof(MultipleChoiceQuestion))]
[JsonDerivedType(typeof(ValueToleranceQuestion), nameof(ValueToleranceQuestion))]
[JsonDerivedType(typeof(EssayQuestion), nameof(EssayQuestion))]
public abstract class QuestionBody
{
}

public class MultipleChoiceQuestion : QuestionBody
{
    [Required] public required string CorrectAnswer { get; set; }
    [Required]
    [JsonConverter(typeof(QuestionChoiceListConverter))]
    public required List<QuestionChoice> Choices { get; set; }
}

public class ValueToleranceQuestion : QuestionBody
{
    [Required] public required decimal CorrectAnswer { get; set; }
    [Required] public required decimal Tolerance { get; set; }
}

public class EssayQuestion : QuestionBody
{
    public int? MaxLength { get; set; }
}

[JsonDerivedType(typeof(MultipleChoiceSubmission), "MultipleChoice")]
[JsonDerivedType(typeof(ValueToleranceSubmission), "ValueTolerance")]
[JsonDerivedType(typeof(EssaySubmission), "Essay")]
public abstract class QuestionSubmission
{
    public required Guid QuestionId { get; set; }

    public abstract bool IsCorrect { get; }

    /// <summary>True for questions that are scored automatically on submit.</summary>
    public virtual bool IsAutoGraded => true;

    /// <summary>True when an essay is still waiting for admin grading.</summary>
    public virtual bool IsPendingGrade => false;
}

public class MultipleChoiceSubmission : QuestionSubmission
{
    public required string StudentAnswer { get; set; }
    [JsonConverter(typeof(QuestionChoiceListConverter))]
    public required List<QuestionChoice> Choices { get; set; }
    public required string CorrectAnswer { get; set; }
    public override bool IsCorrect => StudentAnswer == CorrectAnswer;
}

public class ValueToleranceSubmission : QuestionSubmission
{
    public required decimal StudentAnswer { get; set; }
    public required decimal CorrectAnswer { get; set; }
    public required decimal Tolerance { get; set; }
    public override bool IsCorrect => Math.Abs(StudentAnswer - CorrectAnswer) <= Tolerance;
}

public class EssaySubmission : QuestionSubmission
{
    public required string StudentAnswer { get; set; }
    public bool? IsGradedCorrect { get; set; }
    public DateTime? GradedAt { get; set; }
    public Guid? GradedBy { get; set; }

    public override bool IsAutoGraded => false;
    public override bool IsPendingGrade => IsGradedCorrect is null;
    public override bool IsCorrect => IsGradedCorrect == true;
}

/// <summary>Deserializes legacy string[] choices into QuestionChoice objects.</summary>
public sealed class QuestionChoiceListConverter : JsonConverter<List<QuestionChoice>>
{
    public override List<QuestionChoice> Read(ref Utf8JsonReader reader, Type typeToConvert,
        JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.StartArray)
            throw new JsonException("Expected start of array for choices");

        var list = new List<QuestionChoice>();
        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndArray)
                break;

            if (reader.TokenType == JsonTokenType.String)
            {
                var text = reader.GetString()!;
                list.Add(new QuestionChoice { Id = text, Text = text });
            }
            else if (reader.TokenType == JsonTokenType.StartObject)
            {
                using var doc = JsonDocument.ParseValue(ref reader);
                var root = doc.RootElement;
                var id = root.TryGetProperty("id", out var idProp) ? idProp.GetString()
                    : root.TryGetProperty("Id", out var idProp2) ? idProp2.GetString()
                    : null;
                var text = root.TryGetProperty("text", out var textProp) ? textProp.GetString()
                    : root.TryGetProperty("Text", out var textProp2) ? textProp2.GetString()
                    : null;
                var imageUrl = root.TryGetProperty("imageUrl", out var imgProp) ? imgProp.GetString()
                    : root.TryGetProperty("ImageUrl", out var imgProp2) ? imgProp2.GetString()
                    : null;
                id ??= text ?? imageUrl ?? Guid.NewGuid().ToString("N");
                list.Add(new QuestionChoice { Id = id, Text = text, ImageUrl = imageUrl });
            }
            else
            {
                throw new JsonException("Invalid choice element");
            }
        }

        return list;
    }

    public override void Write(Utf8JsonWriter writer, List<QuestionChoice> value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        foreach (var choice in value)
        {
            writer.WriteStartObject();
            writer.WriteString("id", choice.Id);
            if (choice.Text is not null) writer.WriteString("text", choice.Text);
            if (choice.ImageUrl is not null) writer.WriteString("imageUrl", choice.ImageUrl);
            writer.WriteEndObject();
        }

        writer.WriteEndArray();
    }
}

public record MultipleChoiceNotAnswered
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required]
    [JsonConverter(typeof(QuestionChoiceListConverter))]
    public required List<QuestionChoice> Choices { get; set; }
}

public record ValueToleranceNotAnswered
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required] public required decimal Tolerance { get; set; }
}

public record EssayNotAnswered
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    public int? MaxLength { get; set; }
}

public record MultipleChoiceWithStudentAnswer
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required]
    [JsonConverter(typeof(QuestionChoiceListConverter))]
    public required List<QuestionChoice> Choices { get; set; }
    [Required] public required string StudentAnswer { get; set; }
}

public record ValueToleranceWithStudentAnswer
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required] public required decimal Tolerance { get; set; }
    [Required] public required decimal StudentAnswer { get; set; }
}

public record EssayWithStudentAnswer
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required] public required string StudentAnswer { get; set; }
    public bool? IsGradedCorrect { get; set; }
    public bool IsPendingGrade { get; set; }
}

public record ValueToleranceWithCorrectAnswer
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required] public required decimal Tolerance { get; set; }
    [Required] public required decimal CorrectAnswer { get; set; }
    [Required] public required decimal StudentAnswer { get; set; }
    [Required] public required bool IsCorrect { get; set; }
}

public record MultipleChoiceWithCorrectAnswer
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required]
    [JsonConverter(typeof(QuestionChoiceListConverter))]
    public required List<QuestionChoice> Choices { get; set; }
    [Required] public required string CorrectAnswer { get; set; }
    [Required] public required string StudentAnswer { get; set; }
    [Required] public required bool IsCorrect { get; set; }
}

public record EssayWithCorrectAnswer
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string Text { get; set; }
    [Required] public required string Description { get; set; }
    [Required] public required string? Image { get; set; }
    [Required] public required string StudentAnswer { get; set; }
    public bool? IsGradedCorrect { get; set; }
    public bool IsPendingGrade { get; set; }
    public bool? IsCorrect { get; set; }
}
