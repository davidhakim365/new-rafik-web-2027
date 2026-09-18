using LearnMS.API.Common;
using LearnMS.API.Common.ImgBb;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.PaymentRequests.Contracts;
using LearnMS.API.Features.Students;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.PaymentRequests;

public sealed class PaymentRequestsService(AppDbContext db, IImgBbService imgBbService) : IPaymentRequestsService
{
    private const decimal MinAmount = 1;
    private const decimal MaxAmount = 100_000;
    private const long MaxImageBytes = 10 * 1024 * 1024;
    private static readonly HashSet<string> AllowedImageContentTypes =
    [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    public async Task<PaymentRequestItem> ExecuteAsync(CreatePaymentRequestCommand command, CancellationToken ct = default)
    {
        if (command.Amount < MinAmount || command.Amount > MaxAmount)
            throw new ApiException(PaymentRequestsErrors.InvalidAmount);

        ValidateImage(command.Image);

        var student = await db.Students.FirstOrDefaultAsync(x => x.Id == command.StudentId, ct);
        if (student is null)
            throw new ApiException(StudentsErrors.NotFound);

        var hasPending = await db.PaymentRequests.AnyAsync(
            x => x.StudentId == command.StudentId && x.Status == PaymentRequestStatus.Pending,
            ct);
        if (hasPending)
            throw new ApiException(PaymentRequestsErrors.PendingExists);

        var upload = await imgBbService.UploadWithThumbAsync(command.Image, ct);

        var note = string.IsNullOrWhiteSpace(command.Note) ? null : command.Note.Trim();
        if (note is { Length: > 500 })
            note = note[..500];

        var request = new PaymentRequest
        {
            StudentId = student.Id,
            Amount = command.Amount,
            ImageUrl = upload.Url,
            ImageThumbUrl = upload.ThumbUrl,
            Note = note,
            Status = PaymentRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await db.PaymentRequests.AddAsync(request, ct);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (
            ex.InnerException?.Message.Contains(
                "IX_PaymentRequests_StudentId_Pending",
                StringComparison.OrdinalIgnoreCase) == true)
        {
            throw new ApiException(PaymentRequestsErrors.PendingExists);
        }

        return await GetItemAsync(request.Id) ?? throw new ApiException(PaymentRequestsErrors.NotFound);
    }

    public async Task<PaymentRequestItem> ExecuteAsync(ConfirmPaymentRequestCommand command)
    {
        var request = await db.PaymentRequests.FirstOrDefaultAsync(x => x.Id == command.Id);
        if (request is null)
            throw new ApiException(PaymentRequestsErrors.NotFound);

        if (request.Status != PaymentRequestStatus.Pending)
            throw new ApiException(PaymentRequestsErrors.AlreadyReviewed);

        var student = await db.Students.FirstOrDefaultAsync(x => x.Id == request.StudentId);
        if (student is null)
            throw new ApiException(StudentsErrors.NotFound);

        request.Status = PaymentRequestStatus.Confirmed;
        request.ReviewedById = command.ReviewedById;
        request.ReviewedAt = DateTime.UtcNow;

        student.AddCredit(command.AssistantId, request.Amount, out var studentCredit);
        await db.AddAsync(studentCredit);
        db.Update(student);
        db.Update(request);
        await db.SaveChangesAsync();

        return await GetItemAsync(request.Id) ?? throw new ApiException(PaymentRequestsErrors.NotFound);
    }

    public async Task<PaymentRequestItem> ExecuteAsync(RejectPaymentRequestCommand command)
    {
        var request = await db.PaymentRequests.FirstOrDefaultAsync(x => x.Id == command.Id);
        if (request is null)
            throw new ApiException(PaymentRequestsErrors.NotFound);

        if (request.Status != PaymentRequestStatus.Pending)
            throw new ApiException(PaymentRequestsErrors.AlreadyReviewed);

        var reason = string.IsNullOrWhiteSpace(command.Reason) ? null : command.Reason.Trim();
        if (reason is { Length: > 500 })
            reason = reason[..500];

        if (reason is not null)
            await AddRejectionReasonAsync(reason);

        request.Status = PaymentRequestStatus.Rejected;
        request.RejectionReason = reason;
        request.ReviewedById = command.ReviewedById;
        request.ReviewedAt = DateTime.UtcNow;

        db.Update(request);
        await db.SaveChangesAsync();

        return await GetItemAsync(request.Id) ?? throw new ApiException(PaymentRequestsErrors.NotFound);
    }

    public async Task<PageList<PaymentRequestItem>> QueryAsync(GetMyPaymentRequestsQuery query)
    {
        var (page, pageSize) = NormalizePaging(query.Page, query.PageSize);
        var source = MapItems(db.PaymentRequests.Where(x => x.StudentId == query.StudentId));
        return await PageList<PaymentRequestItem>.CreateAsync(source, page, pageSize);
    }

    public async Task<PageList<PaymentRequestItem>> QueryAsync(GetPaymentRequestsQuery query)
    {
        var (page, pageSize) = NormalizePaging(query.Page, query.PageSize);
        string? search = null;
        if (!string.IsNullOrWhiteSpace(query.Search))
            search = query.Search.Trim().ToLower();

        var requests = db.PaymentRequests.AsQueryable();
        if (query.Status is not null)
            requests = requests.Where(x => x.Status == query.Status);

        var source =
            from request in requests
            join student in db.Students on request.StudentId equals student.Id
            join account in db.Accounts on student.Id equals account.Id
            where search == null
                || student.FullName.ToLower().Contains(search)
                || account.Email.ToLower().Contains(search)
                || student.PhoneNumber.ToLower().Contains(search)
                || student.StudentCode.ToLower().Contains(search)
            orderby request.CreatedAt ascending
            select new PaymentRequestItem
            {
                Id = request.Id,
                Amount = request.Amount,
                ImageUrl = request.ImageUrl,
                ImageThumbUrl = request.ImageThumbUrl,
                Note = request.Note,
                Status = request.Status,
                RejectionReason = request.RejectionReason,
                CreatedAt = request.CreatedAt,
                ReviewedAt = request.ReviewedAt,
                StudentId = student.Id,
                StudentName = student.FullName,
                StudentEmail = account.Email,
                StudentPhone = student.PhoneNumber,
                StudentCode = student.StudentCode
            };

        var result = await PageList<PaymentRequestItem>.CreateAsync(source, page, pageSize);
        await AttachPreviousRequestsAsync(result.Items);
        return result;
    }

    public async Task<PaymentRequestStats> QueryStatsAsync(CancellationToken ct = default)
    {
        var rows = await db.PaymentRequests
            .AsNoTracking()
            .GroupBy(x => x.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        return new PaymentRequestStats
        {
            Pending = rows.FirstOrDefault(x => x.Status == PaymentRequestStatus.Pending)?.Count ?? 0,
            Confirmed = rows.FirstOrDefault(x => x.Status == PaymentRequestStatus.Confirmed)?.Count ?? 0,
            Rejected = rows.FirstOrDefault(x => x.Status == PaymentRequestStatus.Rejected)?.Count ?? 0
        };
    }

    public async Task<IReadOnlyList<PaymentRequestRejectionReasonItem>> QueryRejectionReasonsAsync(
        CancellationToken ct = default)
    {
        return await db.PaymentRequestRejectionReasons
            .AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.CreatedAt)
            .Select(x => new PaymentRequestRejectionReasonItem
            {
                Id = x.Id,
                Text = x.Text,
                SortOrder = x.SortOrder
            })
            .ToListAsync(ct);
    }

    public async Task<PaymentRequestRejectionReasonItem> AddRejectionReasonAsync(
        string text,
        CancellationToken ct = default)
    {
        var reason = text.Trim();
        if (string.IsNullOrWhiteSpace(reason))
            throw new ApiException(PaymentRequestsErrors.InvalidRejectionReason);

        if (reason.Length > 500)
            reason = reason[..500];

        var existing = await db.PaymentRequestRejectionReasons
            .FirstOrDefaultAsync(x => x.Text.ToLower() == reason.ToLower(), ct);

        if (existing is not null)
        {
            return new PaymentRequestRejectionReasonItem
            {
                Id = existing.Id,
                Text = existing.Text,
                SortOrder = existing.SortOrder
            };
        }

        var maxOrder = await db.PaymentRequestRejectionReasons
            .Select(x => (int?)x.SortOrder)
            .MaxAsync(ct) ?? 0;

        var item = new PaymentRequestRejectionReason
        {
            Text = reason,
            SortOrder = maxOrder + 1,
            CreatedAt = DateTime.UtcNow
        };

        await db.PaymentRequestRejectionReasons.AddAsync(item, ct);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            var duplicate = await db.PaymentRequestRejectionReasons
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Text.ToLower() == reason.ToLower(), ct);
            if (duplicate is not null)
            {
                return new PaymentRequestRejectionReasonItem
                {
                    Id = duplicate.Id,
                    Text = duplicate.Text,
                    SortOrder = duplicate.SortOrder
                };
            }

            throw;
        }

        return new PaymentRequestRejectionReasonItem
        {
            Id = item.Id,
            Text = item.Text,
            SortOrder = item.SortOrder
        };
    }

    public static async Task EnsurePaymentRequestsTable(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "PaymentRequests" (
                "Id" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "Amount" numeric(18,2) NOT NULL,
                "ImageUrl" character varying(2048) NOT NULL,
                "ImageThumbUrl" character varying(2048) NULL,
                "Note" character varying(500) NULL,
                "Status" text NOT NULL DEFAULT 'Pending',
                "ReviewedById" uuid NULL,
                "RejectionReason" character varying(500) NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                "ReviewedAt" timestamp with time zone NULL,
                CONSTRAINT "PK_PaymentRequests" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_PaymentRequests_Students_StudentId"
                    FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS "IX_PaymentRequests_CreatedAt"
                ON "PaymentRequests" ("CreatedAt");

            CREATE INDEX IF NOT EXISTS "IX_PaymentRequests_Status"
                ON "PaymentRequests" ("Status");

            CREATE INDEX IF NOT EXISTS "IX_PaymentRequests_StudentId"
                ON "PaymentRequests" ("StudentId");

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_PaymentRequests_StudentId_Pending"
                ON "PaymentRequests" ("StudentId")
                WHERE "Status" = 'Pending';

            CREATE TABLE IF NOT EXISTS "PaymentRequestRejectionReasons" (
                "Id" uuid NOT NULL,
                "Text" character varying(500) NOT NULL,
                "SortOrder" integer NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_PaymentRequestRejectionReasons" PRIMARY KEY ("Id")
            );

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_PaymentRequestRejectionReasons_Text"
                ON "PaymentRequestRejectionReasons" (LOWER("Text"));

            DELETE FROM "PaymentRequestRejectionReasons"
            WHERE LOWER("Text") IN (
                LOWER('Screenshot is not clear'),
                LOWER('Amount does not match the transfer'),
                LOWER('Transfer was not received'),
                LOWER('This screenshot was used before')
            )
            OR "Id" IN (
                'a11c0001-15e0-4a11-9e01-000000000001',
                'a11c0001-15e0-4a11-9e01-000000000002',
                'a11c0001-15e0-4a11-9e01-000000000003',
                'a11c0001-15e0-4a11-9e01-000000000004'
            );

            INSERT INTO "PaymentRequestRejectionReasons" ("Id", "Text", "SortOrder", "CreatedAt")
            SELECT 'a11c0001-15e0-4a11-9e01-000000000001', 'التاريخ فى صورة التحويل قديم', 1, NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM "PaymentRequestRejectionReasons"
                WHERE LOWER("Text") = LOWER('التاريخ فى صورة التحويل قديم')
            );

            INSERT INTO "PaymentRequestRejectionReasons" ("Id", "Text", "SortOrder", "CreatedAt")
            SELECT 'a11c0001-15e0-4a11-9e01-000000000002', 'صورة التحويل مستخدمة من قبل', 2, NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM "PaymentRequestRejectionReasons"
                WHERE LOWER("Text") = LOWER('صورة التحويل مستخدمة من قبل')
            );

            INSERT INTO "PaymentRequestRejectionReasons" ("Id", "Text", "SortOrder", "CreatedAt")
            SELECT 'a11c0001-15e0-4a11-9e01-000000000003', 'تاريخ التحويل مش ظاهر فى الصوره', 3, NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM "PaymentRequestRejectionReasons"
                WHERE LOWER("Text") = LOWER('تاريخ التحويل مش ظاهر فى الصوره')
            );
            """);
    }

    private IQueryable<PaymentRequestItem> MapItems(IQueryable<PaymentRequest> requests)
    {
        return from request in requests
            join student in db.Students on request.StudentId equals student.Id
            join account in db.Accounts on student.Id equals account.Id
            orderby request.CreatedAt descending
            select new PaymentRequestItem
            {
                Id = request.Id,
                Amount = request.Amount,
                ImageUrl = request.ImageUrl,
                ImageThumbUrl = request.ImageThumbUrl,
                Note = request.Note,
                Status = request.Status,
                RejectionReason = request.RejectionReason,
                CreatedAt = request.CreatedAt,
                ReviewedAt = request.ReviewedAt,
                StudentId = student.Id,
                StudentName = student.FullName,
                StudentEmail = account.Email,
                StudentPhone = student.PhoneNumber,
                StudentCode = student.StudentCode
            };
    }

    private async Task<PaymentRequestItem?> GetItemAsync(Guid id)
    {
        var item = await MapItems(db.PaymentRequests.Where(x => x.Id == id)).FirstOrDefaultAsync();
        if (item is null)
            return null;

        var items = new List<PaymentRequestItem> { item };
        await AttachPreviousRequestsAsync(items);
        return items[0];
    }

    private async Task AttachPreviousRequestsAsync(List<PaymentRequestItem> items, CancellationToken ct = default)
    {
        if (items.Count == 0)
            return;

        var studentIds = items.Select(x => x.StudentId).Distinct().ToList();
        var history = await db.PaymentRequests
            .AsNoTracking()
            .Where(x => studentIds.Contains(x.StudentId)
                && x.Status == PaymentRequestStatus.Confirmed)
            .Select(x => new
            {
                x.Id,
                x.StudentId,
                x.CreatedAt,
                x.ReviewedAt,
                x.Amount,
                x.Status,
                x.ImageUrl,
                x.ImageThumbUrl,
                x.Note
            })
            .ToListAsync(ct);

        for (var i = 0; i < items.Count; i++)
        {
            var current = items[i];
            var previous = history
                .Where(x => x.StudentId == current.StudentId && x.Id != current.Id)
                .OrderByDescending(x => x.ReviewedAt ?? x.CreatedAt)
                .ThenByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .FirstOrDefault();

            if (previous is null)
                continue;

            items[i] = current with
            {
                LastRequestAt = previous.CreatedAt,
                LastRequestAmount = previous.Amount,
                LastRequestStatus = previous.Status,
                LastRequestImageUrl = previous.ImageUrl,
                LastRequestImageThumbUrl = previous.ImageThumbUrl,
                LastRequestNote = previous.Note
            };
        }
    }

    private static (int Page, int PageSize) NormalizePaging(int? page, int? pageSize)
    {
        var normalizedPage = page is null or < 1 ? 1 : page.Value;
        var normalizedPageSize = pageSize is null or < 1 ? 10 : Math.Min(pageSize.Value, 100);
        return (normalizedPage, normalizedPageSize);
    }

    private static void ValidateImage(IFormFile image)
    {
        if (image.Length <= 0)
            throw new ApiException(PaymentRequestsErrors.InvalidImage);

        if (image.Length > MaxImageBytes)
            throw new ApiException(PaymentRequestsErrors.ImageTooLarge);

        var contentType = image.ContentType?.ToLowerInvariant() ?? "";
        if (!AllowedImageContentTypes.Contains(contentType))
            throw new ApiException(PaymentRequestsErrors.InvalidImage);
    }
}
