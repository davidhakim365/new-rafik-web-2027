using System.Globalization;
using CsvHelper;
using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Courses.Contracts;
using LearnMS.API.Features.Students;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Courses.Lectures;

[Route("/api/courses/{courseId}/lectures")]
[Tags("Lectures")]
public sealed class LecturesController : ControllerBase
{
    private readonly ICoursesService _coursesService;
    private readonly ICurrentUserService _currentUserService;
    private readonly AppDbContext _context;

    public LecturesController(
        ICoursesService coursesService,
        ICurrentUserService currentUserService,
        AppDbContext context
    )
    {
        _coursesService = coursesService;
        _currentUserService = currentUserService;
        _context = context;
    }


    [HttpDelete("{lectureId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "DeleteLecture")]
    public async Task<ApiWrapper.Success<object?>> Delete(Guid lectureId, Guid courseId)
    {
        await _coursesService.ExecuteAsync(
            new DeleteLectureCommand { CourseId = courseId, Id = lectureId }
        );
        return new ApiWrapper.Success<object?> { Message = "Lecture deleted successfully" };
    }


    [HttpPut("{lectureId:guid}/toggle-important")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageLecture])]
    [SwaggerOperation(OperationId = "ToggleLectureImportant")]
    public async Task<ApiWrapper.Success<object?>> ToggleImportant(Guid lectureId, Guid courseId)
    {
        var lecture = await _context
            .Lectures.FirstOrDefaultAsync(
                l => l.Id == lectureId && l.CourseId == courseId
            ) ?? throw new ApiException(LecturesErrors.NotFound);

        lecture.IsImportant = !lecture.IsImportant;

        await _context.SaveChangesAsync();

        return new ApiWrapper.Success<object?>
            { Message = lecture.IsImportant ? "Lecture marked as important" : "Lecture marked as not important" };
    }


    [HttpPost("{lectureId:guid}/buy")]
    [ApiAuthorize(Role = UserRole.Student)]
    [SwaggerOperation(OperationId = "BuyLecture")]
    public async Task<ApiWrapper.Success<object?>> Buy(Guid lectureId, Guid courseId)
    {
        var currentUser = await _currentUserService.GetUserAsync();

        await _coursesService.ExecuteAsync(
            new BuyLectureCommand
            {
                CourseId = courseId,
                LectureId = lectureId,
                StudentId = currentUser!.Id
            }
        );

        return new ApiWrapper.Success<object?> { Message = "Lecture purchased successfully" };
    }


    [HttpGet("{lectureId:guid}")]
    [SwaggerOperation(OperationId = "GetLecture")]
    [ApiAuthorize]
    public async Task<ApiWrapper.Success<GetLectureResult>> Get(Guid lectureId, Guid courseId)
    {
        var currentUser = await _currentUserService.GetUserAsync();

        GetLectureResult result;

        if (currentUser is null)
            result = await _coursesService.QueryAsync(
                new GetLectureQuery
                {
                    LectureId = lectureId,
                    CourseId = courseId,
                    IsCoursePublished = true,
                    IsPublished = true
                }
            );
        else if (currentUser.Role == UserRole.Student)
            result = await _coursesService.QueryAsync(
                new GetStudentLectureQuery
                {
                    CourseId = courseId,
                    LectureId = lectureId,
                    StudentId = currentUser.Id
                }
            );
        else
            result = await _coursesService.QueryAsync(
                new GetLectureQuery { LectureId = lectureId, CourseId = courseId }
            );

        return new ApiWrapper.Success<GetLectureResult>
        {
            Data = result,
            Message = "Fetched lecture successfully"
        };
    }


    [HttpPost]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "CreateLecture")]
    public async Task<ApiWrapper.Success<object?>> Post(
        [FromBody] CreateLectureRequest request,
        Guid courseId
    )
    {
        await _coursesService.ExecuteAsync(
            new CreateLectureCommand { CourseId = courseId, Title = request.Title }
        );

        return new ApiWrapper.Success<object?> { Message = "Created lecture successfully" };
    }


    [HttpPatch("{lectureId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "UpdateLecture")]
    public async Task<ApiWrapper.Success<object?>> Patch(
        [FromForm] UpdateLectureRequest request,
        Guid lectureId,
        Guid courseId
    )
    {
        await _coursesService.ExecuteAsync(
            new UpdateLectureCommand
            {
                CourseId = courseId,
                ImageUrl = request.ImageUrl,
                Id = lectureId,
                Title = request.Title,
                Description = request.Description,
                Price = request.Price,
                ExpirationDays = request.ExpirationDays,
                RenewalPrice = request.RenewalPrice
            }
        );

        return new ApiWrapper.Success<object?> { Message = "Updated course successfully" };
    }


    [HttpPost("{lectureId:guid}/publish")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "PublishLecture")]
    public async Task<ApiWrapper.Success<object?>> Publish(Guid lectureId, Guid courseId)
    {
        await _coursesService.ExecuteAsync(
            new PublishLectureCommand { Id = lectureId, CourseId = courseId }
        );
        ;

        return new ApiWrapper.Success<object?> { Message = "Published lecture successfully" };
    }


    [HttpPost("{lectureId:guid}/unPublish")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "UnPublishLecture")]
    public async Task<ApiWrapper.Success<object?>> Unpublish(Guid lectureId, Guid courseId)
    {
        await _coursesService.ExecuteAsync(
            new UnPublishLectureCommand { Id = lectureId, CourseId = courseId }
        );

        return new ApiWrapper.Success<object?> { Message = "Unpublished lecture successfully" };
    }


    [HttpPut("{lectureId:guid}/students/{studentId:guid}/homework")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "ChangeLectureHomeworkScore")]
    public async Task<ApiWrapper.Success<object?>> ChangeHomeworkScore(
        [FromBody] ChangeLectureHomeworkScoreRequest request,
        Guid lectureId,
        Guid studentId,
        Guid courseId
    )
    {
        await _coursesService.ExecuteAsync(
            new ChangeLectureHomeworkScoreCommand
            {
                CourseId = courseId,
                LectureId = lectureId,
                StudentId = studentId,
                Score = request.Score
            }
        );

        return new ApiWrapper.Success<object?> { Message = "Homework score changed successfully" };
    }


    [HttpPut("{lectureId:guid}/students/{studentId:guid}/quiz")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "ChangeLectureQuizScore")]
    public async Task<ApiWrapper.Success<object?>> ChangeQuizScore(
        [FromBody] ChangeLectureQuizScoreRequest request,
        Guid lectureId,
        Guid studentId,
        Guid courseId
    )
    {
        await _coursesService.ExecuteAsync(
            new ChangeLectureQuizScoreCommand
            {
                CourseId = courseId,
                LectureId = lectureId,
                StudentId = studentId,
                Score = request.Score
            }
        );

        return new ApiWrapper.Success<object?> { Message = "Quiz score changed successfully" };
    }


    [HttpGet("{lectureId:guid}/students")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "GetLectureStudents")]
    public async Task<ApiWrapper.Success<PageList<SingleLectureStudent>>> GetStudents(
        Guid lectureId,
        Guid courseId,
        int page,
        int pageSize,
        string search
    )
    {
        var result = await _coursesService.QueryAsync(
            new GetLectureStudentsQuery
            {
                CourseId = courseId,
                LectureId = lectureId,
                Page = page,
                PageSize = pageSize,
                Search = search
            }
        );

        return new ApiWrapper.Success<PageList<SingleLectureStudent>>
        {
            Data = result,
            Message = "Students fetched successfully"
        };
    }


    [HttpPut("{lectureId:guid}/assets")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "UpdateLectureAssets")]
    public async Task<ApiWrapper.Success<object?>> UpdateAssets(
        [FromBody] List<string> assetsIds,
        Guid lectureId,
        Guid courseId
    )
    {
        await _coursesService.ExecuteAsync(
            new UpdateLectureAssetsCommand
            {
                CourseId = courseId,
                LectureId = lectureId,
                AssetsIds = assetsIds
            }
        );

        return new ApiWrapper.Success<object?> { Message = "PDFs updated successfully" };
    }

    [HttpPost("{lectureId:guid}/students/{code}/attend")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "AttendLecture")]
    public async Task<ApiWrapper.Success<object?>> AttendLecture(Guid lectureId, string code)
    {
        var lecture = await _context
            .Lectures
            .Include(x => x.LectureAttendances
                .Where(a => a.Student.StudentCode.Trim().ToLower() == code.Trim().ToLower()).Take(1)
            )
            .FirstOrDefaultAsync(x => x.Id == lectureId) ?? throw new ApiException(LecturesErrors.NotFound);

        var student
            = await _context
                  .Students
                  .FirstOrDefaultAsync(x => x.StudentCode.Trim().ToLower() == code.Trim().ToLower()) ??
              throw new ApiException(StudentsErrors.NotFound);


        if (lecture.LectureAttendances.FirstOrDefault(a => a.StudentId == student.Id) is not { } lectureAttendance)
        {
            lecture
                .LectureAttendances
                .Add(new LectureAttendance
                {
                    LectureId = lectureId,
                    StudentId = student.Id,
                    AttendedAt = DateTime.UtcNow
                });
        }
        else
        {
            lectureAttendance.AttendedAt ??= DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return new ApiWrapper.Success<object?> { Message = $"{student.FullName} attended successfully" };
    }


    [HttpPost("{lectureId:guid}/students/{studentId:guid}/toggle-attendance")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "ToggleLectureAttendance")]
    public async Task<ApiWrapper.Success<object?>> ToggleAttendance(Guid lectureId, Guid studentId)
    {
        await _coursesService.ExecuteAsync(
            new ToggleStudentAttendance { StudentId = studentId, LectureId = lectureId }
        );

        return new ApiWrapper.Success<object?> { Message = "Updated attendance successfully" };
    }


    [HttpPost("{lectureId:guid}/students/{studentId:guid}/enroll")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    [SwaggerOperation(OperationId = "EnrollStudentInLecture")]
    public async Task<ApiWrapper.Success<object?>> EnrollStudent(
        Guid lectureId,
        Guid studentId,
        Guid courseId
    )
    {
        await _coursesService.ExecuteAsync(
            new EnrollStudentInLectureCommand
            {
                StudentId = studentId,
                LectureId = lectureId,
                CourseId = courseId
            }
        );

        return new ApiWrapper.Success<object?> { Message = "student enrolled successfully" };
    }


    [HttpGet("{lectureId:guid}/students/export")]
    [SwaggerOperation(OperationId = "ExportLectureStudents")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    public async Task<IActionResult> Export(Guid lectureId, Guid courseId)
    {
        var data = _coursesService.QueryAsync(
            new ExportLectureStudentsQuery { CourseId = courseId, LectureId = lectureId }
        );

        Response.Headers.Append("Content-Type", "text/csv");
        Response.Headers.Append("Content-Disposition", "attachment; filename=credit-codes.csv");

        await using var sw = new StreamWriter(Response.Body);
        await using var csv = new CsvWriter(sw, CultureInfo.InvariantCulture);

        await foreach (var records in data)
        {
            await csv.WriteRecordsAsync(records);
            await csv.FlushAsync();
            await sw.FlushAsync();
        }

        return new EmptyResult();
    }


    [HttpPost("{lectureId:guid}/grades")]
    [SwaggerOperation(OperationId = "UpdateLectureGrades")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    public async Task<ApiWrapper.Success<object?>> UpdateLectureGrades(
        [FromBody] UpdateLectureGradesRequest request,
        Guid courseId,
        Guid lectureId
    )
    {
        await _coursesService.ExecuteAsync(
            new UpdateLectureGradesCommand(courseId, lectureId, request.Grades)
        );

        return new ApiWrapper.Success<object?> { Message = "Lecture grades updated successfully" };
    }
}