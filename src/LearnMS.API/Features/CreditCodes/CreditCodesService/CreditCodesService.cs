using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Courses.Contracts;
using LearnMS.API.Features.CreditCodes.Contracts;
using LearnMS.API.Features.Students;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.CreditCodes;

public class CreditCodesService : ICreditCodesService
{
    private readonly AppDbContext db;
    private readonly ICodeGenerator _codeGenerator;

    public CreditCodesService(AppDbContext db, ICodeGenerator codeGenerator)
    {
        this.db = db;
        _codeGenerator = codeGenerator;
    }

    public async Task ExecuteAsync(GenerateCreditCodesCommand request)
    {
        List<CreditCode> creditCodes = new();
        for (var i = 0; i < request.Count; i++)
        {
            var code = await _codeGenerator.GenerateAsync(9,
                async (code) => { return await db.CreditCodes.CountAsync(x => x.Code == code) == 0; });

            CreditCode creditCode = new()
            {
                Code = code,
                Value = request.Value,
                GeneratorId = request.GeneratorId
            };
            creditCodes.Add(creditCode);
        }

        await db.CreditCodes.AddRangeAsync(creditCodes);
        await db.SaveChangesAsync();
    }

    public async Task<RedeemCreditCodeResult> ExecuteAsync(RedeemCreditCodeCommand request)
    {
        var creditCode = await db.CreditCodes.FirstOrDefaultAsync(x => x.Code == request.Code);

        if (creditCode is null) throw new ApiException(CreditCodesErrors.InvalidCode);

        var student = await db.Students.FirstOrDefaultAsync(x => x.Id == request.StudentId);

        if (student is null) throw new ApiException(StudentsErrors.NotFound);

        if (creditCode.StudentId is not null) throw new ApiException(CreditCodesErrors.AlreadyRedeemed);

        student.RedeemCode(creditCode, out var redeemedCode);
        db.Update(redeemedCode);

        db.Update(student);

        await db.SaveChangesAsync();

        return new RedeemCreditCodeResult
        {
            Value = creditCode.Value
        };
    }

    public async IAsyncEnumerable<List<ExportSingleCreditCodeResult>> QueryAsync(ExportCreditCodesQuery query)
    {
        var chunkSize = 100;
        var totalRecords = await db.Set<CreditCode>().CountAsync();
        var chunks = (int)Math.Ceiling((double)totalRecords / chunkSize);
        var q = db.Set<CreditCode>().AsNoTracking().OrderBy(x => x.RedeemedAt).AsQueryable();
        if (query.Status != null) q = q.Where(x => x.Status == query.Status);
        for (var i = 0; i < chunks; i++)
        {
            var records = await q.Skip(i * chunkSize).Take(chunkSize).Select(x => new ExportSingleCreditCodeResult()
            {
                Code = x.Code,
                Value = x.Value,
                Status = x.Status,
                GeneratedAt = x.GeneratedAt,
                RedeemedAt = x.RedeemedAt,
                SoldAt = x.SoldAt,
                SoldBy = x.SellerId == null ? null : x.SellerId.ToString(),
                GeneratedBy = x.GeneratorId == null ? null : x.GeneratorId.ToString(),
                RedeemedBy = x.StudentId == null ? null : x.StudentId.ToString()
            }).ToListAsync();
            yield return records;
        }
    }


    public async Task<SellCreditCodesResult> ExecuteAsync(SellCreditCodesCommand request)
    {
        List<CreditCode> soldCodes = new();

        foreach (var toBeSold in request.Codes)
            try
            {
                var code = await db.CreditCodes
                    .Where(x => x.Code == toBeSold && x.Status == CreditCodeStatus.Fresh)
                    .FirstOrDefaultAsync();
                if (code is null) continue;
                code.SellerId = request.SellerId;
                db.Update(code);
                await db.SaveChangesAsync();
                soldCodes.Add(code);
            }
            catch (Exception)
            {
            }

        return new SellCreditCodesResult
        {
            CreditCodes = soldCodes
        };
    }

    public async Task<PageList<SingleCreditCodeItem>> QueryAsync(GetCreditCodesQuery query)
    {
        CreditCodeStatus? status = null;


        var search = query.Search?.ToLower() ?? "";

        if (search == "redeemed")
            status = CreditCodeStatus.Redeemed;
        else if (search == "sold")
            status = CreditCodeStatus.Sold;
        else if (search == "fresh") status = CreditCodeStatus.Fresh;


        var creditCodesQuery = from code in db.CreditCodes
            join redeemerAccount in db.Accounts on code.StudentId equals redeemerAccount.Id into redeemers
            from redeemer in redeemers.DefaultIfEmpty()
            join generatorAccount in db.Accounts on code.GeneratorId equals generatorAccount.Id into generators
            from generator in generators.DefaultIfEmpty()
            join sellerAccount in db.Accounts on code.SellerId equals sellerAccount.Id into sellers
            from seller in sellers.DefaultIfEmpty()
            orderby code.GeneratedAt descending
            where status != null ? code.Status == status :
                true &&
                query.GeneratorId != null ? code.GeneratorId == query.GeneratorId : true
            select new SingleCreditCodeItem
            {
                Code = code.Code,
                Value = code.Value,
                GeneratedAt = code.GeneratedAt,
                Status = code.Status,
                Redeemer = redeemer != null && code.RedeemedAt != null
                    ? new CreditCodeRedeemer
                    {
                        Id = redeemer.Id,
                        Email = redeemer.Email,
                        RedeemedAt = code.RedeemedAt!.Value
                    }
                    : null,
                Generator = generator != null
                    ? new CreditCodeGenerator
                    {
                        Id = generator.Id,
                        Email = generator.Email
                    }
                    : null,
                SoldAt = code.SoldAt,
                Seller = seller != null && code.SoldAt != null
                    ? new CreditCodeSeller
                    {
                        Id = seller.Id,
                        Email = seller.Email
                    }
                    : null
            }
            into result
            select result;

        if (!string.IsNullOrEmpty(query.Search) && status is null)
            creditCodesQuery = creditCodesQuery.Where(x => x.Code.Contains(query.Search));


        return await PageList<SingleCreditCodeItem>.CreateAsync(creditCodesQuery, query.Page ?? 1,
            query.PageSize ?? 10);
    }
}