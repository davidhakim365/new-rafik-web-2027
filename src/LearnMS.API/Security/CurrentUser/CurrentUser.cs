using LearnMS.API.Entities;

namespace LearnMS.API.Security;

public sealed class CurrentUser
{
    public Guid Id { get; init; }
    public UserRole Role { get; init; }
    public IEnumerable<Permission> Permissions { get; set; } = new List<Permission>();
}

public static class HttpContextCurrentUserExtensions
{

    public static CurrentUser? CurrentUser(this HttpContext httpContext)
    {
        return httpContext.Items["CurrentUser"] as CurrentUser;
    }
}
