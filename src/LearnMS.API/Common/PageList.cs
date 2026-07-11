using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

public sealed class PageList<T>
{
    public PageList(List<T> items, int page, int pageSize, int totalCount)
    {
        Items = items;
        Page = page;
        PageSize = pageSize;
        TotalCount = totalCount;
    }

    [Required]
    public List<T> Items { get; private set; } = [];
    [Required]
    public int Page { get; }
    [Required]
    public int PageSize { get; }
    [Required]
    public int TotalCount { get; }
    [Required]
    public bool HasNextPage => Page * PageSize < TotalCount;
    [Required]
    public bool HasPreviousPage => Page > 1;


    public static async Task<PageList<T>> CreateAsync(IQueryable<T> source, int page, int pageSize)
    {
        var totalCount = await source.CountAsync();
        var items = await source.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new(items, page, pageSize, totalCount);
    }

}