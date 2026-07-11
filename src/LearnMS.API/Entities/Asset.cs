using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace LearnMS.API.Entities;

public sealed class Asset
{
    [Required]
    public required string Id { get; init; }

    [Required]
    public required string Name { get; set; }

    [Required]
    public required AssetType Type { get; set; }

    [JsonIgnore]
    public List<Lecture> Lectures { get; } = [];

    [JsonIgnore]
    public List<LectureAsset> LectureAssets { get; } = [];

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AssetType
{
    Pdf,
    Image,
    Unknown
}
