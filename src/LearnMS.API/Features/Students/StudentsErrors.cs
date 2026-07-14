using LearnMS.API.Common;

namespace LearnMS.API.Features.Students;
public static class StudentsErrors
{
    public static readonly ApiError NotFound = new("student/not-found", "Student not found.", StatusCodes.Status404NotFound);
    public static readonly ApiError LectureNotFound = new("student/lecture-not-found", "Lecture not found for this student's level.", StatusCodes.Status404NotFound);
}