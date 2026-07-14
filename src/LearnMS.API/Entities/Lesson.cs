using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace LearnMS.API.Entities;

public class Lesson : IOrdered
{
    public Guid Id { get; set; }
    public int Order { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; } =".";
    public required decimal RenewalPrice { get; set; } =0;
    public required int ExpirationHours { get; set; } = 0;
    public string? VideoId { get; set; } = "";

    [JsonIgnore]
    public Guid LectureId { get; set; }
    [JsonIgnore]
    public Lecture Lecture { get; set; } = null!;

    public List<Student> AttendedStudents = [];
    public List<LessonAttendance> LessonAttendances = [];
}
