namespace LearnMS.API.Entities;

public class StudentRegistrationSettings
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;

    /// <summary>
    /// When true, students can create accounts via public sign-up.
    /// When false, only assistants/teachers can create students.
    /// </summary>
    public bool IsSignupEnabled { get; set; } = true;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
