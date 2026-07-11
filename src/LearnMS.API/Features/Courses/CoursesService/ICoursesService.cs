using LearnMS.API.Entities;
using LearnMS.API.Features.Courses.Contracts;

namespace LearnMS.API.Features.Courses;

public interface ICoursesService
{
    // commands
    public Task<CreateCourseResult> ExecuteAsync(CreateCourseCommand command);
    public Task ExecuteAsync(UpdateCourseCommand command);
    public Task ExecuteAsync(PublishCourseCommand command);
    public Task ExecuteAsync(UnPublishCourseCommand command);
    public Task ExecuteAsync(CreateLectureCommand command);
    public Task ExecuteAsync(UpdateLectureCommand command);
    public Task ExecuteAsync(DeleteCourseCommand command);
    public Task ExecuteAsync(DeleteLectureCommand command);
    public Task ExecuteAsync(DeleteLessonCommand command);
    public Task ExecuteAsync(PublishLectureCommand command);
    public Task ExecuteAsync(UnPublishLectureCommand command);
    public Task ExecuteAsync(CreateLessonCommand command);
    public Task ExecuteAsync(UpdateLessonCommand command);
    public Task ExecuteAsync(UploadLessonVideoCommand command);
    public Task ExecuteAsync(BuyCourseCommand command);
    public Task ExecuteAsync(BuyLectureCommand command);
    public Task ExecuteAsync(RenewLessonExpirationCommand command);
    public Task ExecuteAsync(AttendLessonCommand command);
    public Task ExecuteAsync(ChangeLectureHomeworkScoreCommand command);
    public Task ExecuteAsync(ChangeLectureQuizScoreCommand command);
    public Task<UpdateQuizResult> ExecuteAsync(UpdateQuizCommand command);
    public Task ExecuteAsync(DeleteQuizCommand command);
    public Task ExecuteAsync(SubmitQuizCommand command);
    public Task ExecuteAsync(BuyExamCommand command);
    public Task ExecuteAsync(UpdateLectureAssetsCommand command);
    public Task<UpdateExamResult> ExecuteAsync(UpdateExamCommand command);
    public Task ExecuteAsync(DeleteExamCommand command);
    public Task ExecuteAsync(SubmitExamCommand command);
    public Task ExecuteAsync(ToggleStudentAttendance command);
    public Task ExecuteAsync(EnrollStudentInLectureCommand command);
    public Task ExecuteAsync(EnrollStudentInExamCommand command);
    public Task ExecuteAsync(RetakeQuizCommand command);
    public Task ExecuteAsync(UpdateLectureGradesCommand command);

    // queries

    public Task<GetCoursesResult> QueryAsync(GetCoursesQuery query);
    public Task<GetStudentCoursesResult> QueryAsync(GetStudentCoursesQuery query);
    public Task<GetDashboardCourseResult> QueryAsync(GetCourseQuery query);
    public Task<GetStudentCourseResult> QueryAsync(GetStudentCourseQuery query);
    public Task<GetLectureResult> QueryAsync(GetLectureQuery query);
    public Task<GetStudentLectureResult> QueryAsync(GetStudentLectureQuery query);
    public Task<GetDashboardLessonResult> QueryAsync(GetLessonQuery query);
    public Task<GetStudentLessonResult> QueryAsync(GetStudentLessonQuery query);
    public Task<PageList<SingleLectureStudent>> QueryAsync(GetLectureStudentsQuery query);
    public Task<QuizResult> QueryAsync(GetQuizQuery query);
    public Task<QuizResult> QueryAsync(GetStudentQuizQuery query);
    public Task<ExamResult> QueryAsync(GetExamQuery query);
    public Task<PageList<SingleExamStudent>> QueryAsync(GetExamStudentsQuery query);
    public IAsyncEnumerable<IEnumerable<ExportSingleLectureStudentResult>> QueryAsync(
        ExportLectureStudentsQuery query
    );
}
