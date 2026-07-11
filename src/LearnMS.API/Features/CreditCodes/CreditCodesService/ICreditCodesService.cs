using LearnMS.API.Features.Courses.Contracts;
using LearnMS.API.Features.CreditCodes.Contracts;

namespace LearnMS.API.Features.CreditCodes;

public interface ICreditCodesService
{
    Task ExecuteAsync(GenerateCreditCodesCommand request);
    Task<RedeemCreditCodeResult> ExecuteAsync(RedeemCreditCodeCommand request);

    Task<PageList<SingleCreditCodeItem>> QueryAsync(GetCreditCodesQuery request);
    public IAsyncEnumerable<List<ExportSingleCreditCodeResult>> QueryAsync(ExportCreditCodesQuery query);

    Task<SellCreditCodesResult> ExecuteAsync(SellCreditCodesCommand request);
}