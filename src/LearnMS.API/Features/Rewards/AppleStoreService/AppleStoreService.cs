using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Rewards.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.Rewards;

public sealed class AppleStoreService(AppDbContext db) : IAppleStoreService
{
    public async Task<AppleStoreSettingsResult> GetSettingsAsync()
    {
        var settings = await GetOrCreateSettingsAsync();
        return MapSettings(settings);
    }

    public async Task<AppleStoreSettingsResult> UpdateSettingsAsync(UpsertAppleStoreSettingsRequest request)
    {
        if (request.OpensAt is not null && request.ClosesAt is not null && request.ClosesAt < request.OpensAt)
            throw new ApiException(RewardsErrors.InvalidStoreWindow);

        var settings = await GetOrCreateSettingsAsync();
        settings.IsEnabled = request.IsEnabled;
        settings.OpensAt = request.OpensAt;
        settings.ClosesAt = request.ClosesAt;
        settings.UpdatedAt = DateTime.UtcNow;
        db.Set<AppleStoreSettings>().Update(settings);
        await db.SaveChangesAsync();
        return MapSettings(settings);
    }

    public async Task<List<AppleRewardItemResult>> ListItemsAsync(bool includeInactive)
    {
        var query = db.Set<AppleRewardItem>().AsNoTracking().AsQueryable();
        if (!includeInactive)
            query = query.Where(x => x.IsActive);

        var rows = await query
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Title)
            .ToListAsync();

        return rows.Select(MapItem).ToList();
    }

    public async Task<AppleRewardItemResult> CreateItemAsync(CreateAppleRewardItemRequest request)
    {
        ValidateItem(request.Title, request.ImageUrl, request.AppleCost);

        var item = new AppleRewardItem
        {
            Title = request.Title.Trim(),
            ImageUrl = request.ImageUrl.Trim(),
            AppleCost = request.AppleCost,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive
        };

        await db.Set<AppleRewardItem>().AddAsync(item);
        await db.SaveChangesAsync();
        return MapItem(item);
    }

    public async Task<AppleRewardItemResult> UpdateItemAsync(Guid itemId, UpdateAppleRewardItemRequest request)
    {
        ValidateItem(request.Title, request.ImageUrl, request.AppleCost);

        var item = await db.Set<AppleRewardItem>().FirstOrDefaultAsync(x => x.Id == itemId)
            ?? throw new ApiException(RewardsErrors.StoreItemNotFound);

        item.Title = request.Title.Trim();
        item.ImageUrl = request.ImageUrl.Trim();
        item.AppleCost = request.AppleCost;
        item.SortOrder = request.SortOrder;
        item.IsActive = request.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        db.Set<AppleRewardItem>().Update(item);
        await db.SaveChangesAsync();
        return MapItem(item);
    }

    public async Task DeleteItemAsync(Guid itemId)
    {
        var item = await db.Set<AppleRewardItem>().FirstOrDefaultAsync(x => x.Id == itemId)
            ?? throw new ApiException(RewardsErrors.StoreItemNotFound);

        // Soft-deactivate so historical orders keep their FK
        item.IsActive = false;
        item.UpdatedAt = DateTime.UtcNow;
        db.Set<AppleRewardItem>().Update(item);
        await db.SaveChangesAsync();
    }

    public async Task<StudentAppleStoreStatusResult> GetPublicStatusAsync()
    {
        var settings = await GetOrCreateSettingsAsync();
        var now = DateTimeOffset.UtcNow;
        return new StudentAppleStoreStatusResult
        {
            IsOpen = settings.IsOpenAt(now),
            OpensAt = settings.OpensAt,
            ClosesAt = settings.ClosesAt
        };
    }

    public async Task<StudentAppleStoreCatalogResult> GetCatalogAsync(Guid studentId)
    {
        var settings = await GetOrCreateSettingsAsync();
        var now = DateTimeOffset.UtcNow;
        var isOpen = settings.IsOpenAt(now);

        var student = await db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.Id == studentId)
            ?? throw new ApiException(RewardsErrors.StudentNotFound);

        List<AppleRewardItemResult> items = [];
        if (isOpen)
        {
            var itemRows = await db.Set<AppleRewardItem>().AsNoTracking()
                .Where(x => x.IsActive)
                .OrderBy(x => x.SortOrder)
                .ThenBy(x => x.Title)
                .ToListAsync();
            items = itemRows.Select(MapItem).ToList();
        }

        var myOrders = await db.Set<AppleRewardOrder>().AsNoTracking()
            .Where(x => x.StudentId == studentId && x.Status == AppleRewardOrderStatus.Active)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new StudentAppleOrderResult
            {
                Id = x.Id,
                ItemId = x.ItemId,
                ItemTitle = x.ItemTitleSnapshot,
                ItemImageUrl = db.Set<AppleRewardItem>()
                    .Where(i => i.Id == x.ItemId)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault(),
                AppleCost = x.AppleCostSnapshot,
                Status = x.Status.ToString(),
                CreatedAt = x.CreatedAt,
                CancelledAt = x.CancelledAt
            })
            .ToListAsync();

        return new StudentAppleStoreCatalogResult
        {
            IsOpen = isOpen,
            OpensAt = settings.OpensAt,
            ClosesAt = settings.ClosesAt,
            Apples = student.Apples,
            ApplesSpentOnActiveOrders = myOrders.Sum(x => x.AppleCost),
            Items = items,
            MyOrders = myOrders
        };
    }

    public async Task<RedeemAppleRewardResult> RedeemAsync(Guid studentId, RedeemAppleRewardRequest request)
    {
        await EnsureStoreOpenAsync();

        var student = await db.Students.FirstOrDefaultAsync(x => x.Id == studentId)
            ?? throw new ApiException(RewardsErrors.StudentNotFound);

        var item = await db.Set<AppleRewardItem>()
            .FirstOrDefaultAsync(x => x.Id == request.ItemId && x.IsActive)
            ?? throw new ApiException(RewardsErrors.StoreItemNotFound);

        if (student.Apples < item.AppleCost)
            throw new ApiException(RewardsErrors.InsufficientApples);

        student.AddApples(
            studentId,
            -item.AppleCost,
            $"Apple store: redeemed {item.Title}",
            out var transaction);

        var order = new AppleRewardOrder
        {
            StudentId = studentId,
            ItemId = item.Id,
            ItemTitleSnapshot = item.Title,
            AppleCostSnapshot = item.AppleCost,
            Status = AppleRewardOrderStatus.Active
        };

        await db.Set<StudentAppleTransaction>().AddAsync(transaction);
        await db.Set<AppleRewardOrder>().AddAsync(order);
        db.Students.Update(student);
        await db.SaveChangesAsync();

        return new RedeemAppleRewardResult
        {
            OrderId = order.Id,
            Apples = student.Apples,
            Message = $"Chose {item.Title} for {item.AppleCost} apples"
        };
    }

    public async Task<CancelAppleRewardResult> CancelAsync(Guid studentId, Guid orderId)
    {
        await EnsureStoreOpenAsync();

        var order = await db.Set<AppleRewardOrder>()
            .FirstOrDefaultAsync(x => x.Id == orderId && x.StudentId == studentId)
            ?? throw new ApiException(RewardsErrors.StoreOrderNotFound);

        if (order.Status != AppleRewardOrderStatus.Active)
            throw new ApiException(RewardsErrors.StoreOrderNotActive);

        var student = await db.Students.FirstOrDefaultAsync(x => x.Id == studentId)
            ?? throw new ApiException(RewardsErrors.StudentNotFound);

        student.AddApples(
            studentId,
            order.AppleCostSnapshot,
            $"Apple store: cancelled {order.ItemTitleSnapshot}",
            out var transaction);

        order.Status = AppleRewardOrderStatus.Cancelled;
        order.CancelledAt = DateTime.UtcNow;

        await db.Set<StudentAppleTransaction>().AddAsync(transaction);
        db.Set<AppleRewardOrder>().Update(order);
        db.Students.Update(student);
        await db.SaveChangesAsync();

        return new CancelAppleRewardResult
        {
            OrderId = order.Id,
            Apples = student.Apples,
            Message = $"Removed {order.ItemTitleSnapshot}; {order.AppleCostSnapshot} apples refunded"
        };
    }

    public async Task<AppleStoreAdminOverviewResult> GetAdminOverviewAsync()
    {
        var orders = await db.Set<AppleRewardOrder>().AsNoTracking().ToListAsync();
        var items = await db.Set<AppleRewardItem>().AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Title)
            .ToListAsync();

        var itemStats = items.Select(item =>
        {
            var itemOrders = orders.Where(o => o.ItemId == item.Id).ToList();
            var active = itemOrders.Where(o => o.Status == AppleRewardOrderStatus.Active).ToList();
            return new AppleStoreItemStat
            {
                ItemId = item.Id,
                Title = item.Title,
                ImageUrl = item.ImageUrl,
                AppleCost = item.AppleCost,
                ActiveOrders = active.Count,
                CancelledOrders = itemOrders.Count(o => o.Status == AppleRewardOrderStatus.Cancelled),
                TotalOrders = itemOrders.Count,
                ApplesSpentActive = active.Sum(o => (long)o.AppleCostSnapshot)
            };
        }).ToList();

        var activeOrders = orders.Where(o => o.Status == AppleRewardOrderStatus.Active).ToList();

        return new AppleStoreAdminOverviewResult
        {
            ActiveOrders = activeOrders.Count,
            CancelledOrders = orders.Count(o => o.Status == AppleRewardOrderStatus.Cancelled),
            TotalOrders = orders.Count,
            ApplesSpentActive = activeOrders.Sum(o => (long)o.AppleCostSnapshot),
            UniqueStudents = activeOrders.Select(o => o.StudentId).Distinct().Count(),
            Items = itemStats
        };
    }

    public async Task<AppleStoreAdminOrdersResult> GetAdminOrdersAsync(
        Guid? itemId,
        StudentLevel? level,
        AppleRewardOrderStatus? status,
        string? search,
        int page,
        int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = BuildOrdersQuery(itemId, level, status, search);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AppleStoreAdminOrderItem
            {
                OrderId = x.Id,
                StudentId = x.StudentId,
                StudentFullName = x.Student!.FullName,
                StudentCode = x.Student.StudentCode,
                Level = x.Student.Level,
                ItemId = x.ItemId,
                ItemTitle = x.ItemTitleSnapshot,
                AppleCost = x.AppleCostSnapshot,
                Status = x.Status.ToString(),
                CreatedAt = x.CreatedAt,
                CancelledAt = x.CancelledAt
            })
            .ToListAsync();

        return new AppleStoreAdminOrdersResult
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async IAsyncEnumerable<List<AppleStoreOrderExportRow>> ExportOrdersAsync(
        Guid? itemId,
        StudentLevel? level,
        AppleRewardOrderStatus? status)
    {
        const int chunk = 100;
        var skip = 0;

        while (true)
        {
            var rows = await BuildOrdersQuery(itemId, level, status, null)
                .OrderByDescending(x => x.CreatedAt)
                .Skip(skip)
                .Take(chunk)
                .Select(x => new AppleStoreOrderExportRow
                {
                    StudentName = x.Student!.FullName,
                    StudentCode = x.Student.StudentCode,
                    Level = x.Student.Level.ToString(),
                    ItemTitle = x.ItemTitleSnapshot,
                    Apples = x.AppleCostSnapshot,
                    Status = x.Status.ToString(),
                    ChosenAt = x.CreatedAt
                })
                .ToListAsync();

            if (rows.Count == 0)
                yield break;

            yield return rows;
            if (rows.Count < chunk)
                yield break;

            skip += chunk;
        }
    }

    private IQueryable<AppleRewardOrder> BuildOrdersQuery(
        Guid? itemId,
        StudentLevel? level,
        AppleRewardOrderStatus? status,
        string? search)
    {
        var query = db.Set<AppleRewardOrder>()
            .AsNoTracking()
            .Include(x => x.Student)
            .AsQueryable();

        if (itemId is not null)
            query = query.Where(x => x.ItemId == itemId);

        if (status is not null)
            query = query.Where(x => x.Status == status);

        if (level is not null)
            query = query.Where(x => x.Student != null && x.Student.Level == level);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x =>
                x.Student != null &&
                (x.Student.FullName.ToLower().Contains(term) ||
                 x.Student.StudentCode.ToLower().Contains(term) ||
                 x.ItemTitleSnapshot.ToLower().Contains(term)));
        }

        return query;
    }

    private async Task EnsureStoreOpenAsync()
    {
        var settings = await GetOrCreateSettingsAsync();
        if (!settings.IsOpenAt(DateTimeOffset.UtcNow))
            throw new ApiException(RewardsErrors.StoreClosed);
    }

    private async Task<AppleStoreSettings> GetOrCreateSettingsAsync()
    {
        var settings = await db.Set<AppleStoreSettings>()
            .FirstOrDefaultAsync(x => x.Id == AppleStoreSettings.SingletonId);

        if (settings is not null)
            return settings;

        settings = new AppleStoreSettings
        {
            Id = AppleStoreSettings.SingletonId,
            IsEnabled = false,
            UpdatedAt = DateTime.UtcNow
        };
        await db.Set<AppleStoreSettings>().AddAsync(settings);
        await db.SaveChangesAsync();
        return settings;
    }

    private static void ValidateItem(string title, string imageUrl, int appleCost)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ApiException(RewardsErrors.InvalidStoreItem);
        if (string.IsNullOrWhiteSpace(imageUrl))
            throw new ApiException(RewardsErrors.InvalidStoreItem);
        if (appleCost <= 0)
            throw new ApiException(RewardsErrors.InvalidStoreItem);
    }

    private static AppleStoreSettingsResult MapSettings(AppleStoreSettings settings) => new()
    {
        IsEnabled = settings.IsEnabled,
        OpensAt = settings.OpensAt,
        ClosesAt = settings.ClosesAt,
        IsOpen = settings.IsOpenAt(DateTimeOffset.UtcNow),
        UpdatedAt = settings.UpdatedAt
    };

    private static AppleRewardItemResult MapItem(AppleRewardItem item) => new()
    {
        Id = item.Id,
        Title = item.Title,
        ImageUrl = item.ImageUrl,
        AppleCost = item.AppleCost,
        IsActive = item.IsActive,
        SortOrder = item.SortOrder,
        CreatedAt = item.CreatedAt,
        UpdatedAt = item.UpdatedAt
    };
}
