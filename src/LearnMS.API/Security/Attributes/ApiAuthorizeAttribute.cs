using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;

namespace LearnMS.API.Security;

public class ApiAuthorizeAttribute : ActionFilterAttribute, IAsyncAuthorizationFilter
{
    public UserRole Role = UserRole.NotSet;
    public Permission[]? Permissions;


    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        await Task.CompletedTask;


        var user = context.HttpContext.CurrentUser();

        if (user is null) throw new ApiException(AuthErrors.Unauthorized);

        if (Role == UserRole.NotSet) return;

        switch (user.Role)
        {
            case UserRole.Teacher when Role is not UserRole.Student:
                return;
            case UserRole.Assistant when Role is not UserRole.Student:
                {
                    if (Permissions is null || Permissions.Any(p => user.Permissions.Contains(p)))
                        return;
                    throw new ApiException(AuthErrors.Forbidden);
                }
            case UserRole.Student when Role is UserRole.Student:
                return;
            default:
                throw new ApiException(AuthErrors.Unauthorized);
        }
    }
}