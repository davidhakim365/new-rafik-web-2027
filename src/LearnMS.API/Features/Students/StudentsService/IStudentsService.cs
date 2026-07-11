using LearnMS.API.Entities;
using LearnMS.API.Features.Students.Contracts;

namespace LearnMS.API.Features.Students;

public interface IStudentsService
{
    public Task ExecuteAsync(CreateStudentCommand command);
    public Task ExecuteAsync(AddStudentCreditCommand command);
    public Task ExecuteAsync(DeleteStudentCommand command);
    public Task ExecuteAsync(UpdateStudentCommand command);
    public Task ExecuteAsync(UnlinkStudentDeviceCommand command);

    public Task<PageList<SingleStudent>> QueryAsync(GetStudentsQuery query);
    public Task<PageList<SingleStudentLecture>> QueryAsync(GetStudentLecturesQuery query);
    public Task<PageList<SingleStudentExam>> QueryAsync(GetStudentExamsQuery query);
    public Task<GetStudentResult> QueryAsync(GetStudentQuery query);
    public IAsyncEnumerable<List<ExportStudentsResult>> QueryAsync(ExportStudentsQuery query);
    public Task<PageList<SingleStudentEvent>> QueryAsync(GetStudentEventsQuery getStudentEventsQuery);
}