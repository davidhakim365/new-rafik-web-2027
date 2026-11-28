namespace LearnMS.API.Entities;

public class RamadanSettings
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;

    /// <summary>When true, Ramadan graphics are shown across the site.</summary>
    public bool Enabled { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
