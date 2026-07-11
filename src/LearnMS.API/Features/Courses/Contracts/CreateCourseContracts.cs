using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record CreateCourseCommand(
    string Title
);


public sealed record CreateCourseResult(Guid Id);
