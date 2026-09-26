using System.Text.Json.Serialization;

namespace LearnMS.API.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DiscountTarget
{
    Lecture,
    Renewal,
    Both
}

public class StudentDiscount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid StudentId { get; set; }
    public Student? Student { get; set; }

    /// <summary>Percent off the chosen price, from just above 0 through 100.</summary>
    public required decimal Percentage { get; set; }

    public required DiscountTarget AppliesTo { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
