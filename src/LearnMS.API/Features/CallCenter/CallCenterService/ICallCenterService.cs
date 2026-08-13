using LearnMS.API.Common;
using LearnMS.API.Features.CallCenter.Contracts;

namespace LearnMS.API.Features.CallCenter;

public interface ICallCenterService
{
    Task<PageList<CallCenterStudentDto>> QueryAsync(GetCallCenterStudentsQuery query);
    Task<CallCenterStudentDto> ExecuteAsync(UpsertCallCenterStudentCommand command);
    Task ExecuteAsync(RecordCallCenterNotifyCommand command);
    Task<SetCallCenterStudentBlockedResult> ExecuteAsync(SetCallCenterStudentBlockedCommand command);
    Task<IReadOnlyList<CallCenterHistoryItemDto>> QueryAsync(GetCallCenterHistoryQuery query);
    Task<CallCenterStudentLecturesResult> QueryAsync(GetCallCenterStudentLecturesQuery query);
    IAsyncEnumerable<List<ExportCallCenterStudentRow>> ExportAsync(ExportCallCenterStudentsQuery query);
}
