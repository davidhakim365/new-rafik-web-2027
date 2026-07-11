using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using LearnMS.API.Security.JwtBearer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LearnMS.API.Security;

public sealed class CustomJwtBearerHandler : JwtBearerHandler
{

    JwtBearerConfig config;
    AppDbContext db;

    [Obsolete]
    public CustomJwtBearerHandler(IOptionsMonitor<JwtBearerOptions> options,
                                  ILoggerFactory logger,
                                  UrlEncoder encoder,
                                  ISystemClock clock,
                                  IOptions<JwtBearerConfig> config,
                                  AppDbContext db) : base(options, logger, encoder, clock)
    {
        this.config = config.Value;
        this.db = db;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {

        if (Context.GetEndpoint()?.Metadata.GetMetadata<IAllowAnonymous>() != null)
        {
            return AuthenticateResult.NoResult();
        }

        if (!Request.Headers.TryGetValue("Authorization", out var headerValue))
        {
            return AuthenticateResult.Fail("Authorization header was not found.");
        }

        var authorizationHeader = headerValue.FirstOrDefault() ??
            throw new ApiException(AuthErrors.Unauthorized);

        var token = authorizationHeader.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase);
        if (string.IsNullOrEmpty(token)) return AuthenticateResult.Fail("Authorization header was not found.");

        var validToken = await new JwtSecurityTokenHandler().ValidateTokenAsync(token, new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = config.Issuer,
            ValidAudience = config.Audience,
            RequireExpirationTime = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config.Secret))
        });


        if (validToken == null || validToken.Claims == null || validToken.Claims.TryGetValue(ClaimTypes.NameIdentifier, out var id) == false)
        {
            return AuthenticateResult.Fail("Authorization header was not found.");
        }

        if (Guid.TryParse(id as string, out var userId) == false) return AuthenticateResult.Fail("Authorization header was not found.");


        var account = await db.Set<Account>()
             .Include(x => x.User)
             .FirstOrDefaultAsync(x => x.Id == userId) ?? throw new ApiException(AuthErrors.Unauthorized);


        if (account.User is Student student)
        {
            if (!Request.Headers.TryGetValue("DeviceKey", out var deviceKey))
            {
                return AuthenticateResult.Fail("DeviceKey header was not found.");
            }
            else if (deviceKey.FirstOrDefault() != student.DeviceKey)
            {
                return AuthenticateResult.Fail("Another device is linked with this account.");
            }
        }

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, account.Id.ToString()),
            new Claim(ClaimTypes.Role, account.User.Role.ToString()),
        };

        var currentUser = new CurrentUser
        {
            Id = account.Id,
            Role = account.User.Role
        };

        if (account.User is Assistant assistant)
        {
            claims.AddRange(assistant.Permissions.Select(x => new Claim("Permission", x.ToString())));
            currentUser.Permissions = assistant.Permissions;
        }

        var claimIdentity = new ClaimsIdentity(claims, JwtBearerDefaults.AuthenticationScheme);
        var validTicket = new AuthenticationTicket(new ClaimsPrincipal(claimIdentity), JwtBearerDefaults.AuthenticationScheme);

        Context.Items["CurrentUser"] = currentUser;

        return AuthenticateResult.Success(validTicket);
    }

}