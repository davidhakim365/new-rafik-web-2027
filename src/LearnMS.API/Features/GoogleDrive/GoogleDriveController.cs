using System.Collections.Concurrent;
using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Security;
using LearnMS.API.ThirdParties.GoogleForms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace LearnMS.API.Features.GoogleDrive;

[Route("api/google-drive")]
[Tags("GoogleDrive")]
public sealed class GoogleDriveController(
    IGoogleFormsService googleAPIs,
    IOptions<GoogleFormsConfig> options
) : ControllerBase
{
    private static readonly ConcurrentDictionary<string, DateTimeOffset> PendingStates = new();

    [HttpGet("status")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    public ApiWrapper.Success<GoogleDriveConnectionStatus> GetStatus()
    {
        return new()
        {
            Data = googleAPIs.GetDriveStatus(),
            Message = "Retrieved Google Drive status"
        };
    }

    [HttpGet("authorize-url")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    public ApiWrapper.Success<GoogleDriveAuthorizeUrl> GetAuthorizeUrl()
    {
        var state = Guid.NewGuid().ToString("N");
        PendingStates[state] = DateTimeOffset.UtcNow.AddMinutes(15);
        var url = googleAPIs.CreateDriveAuthorizationUrl(GetRedirectUri(), state);
        return new()
        {
            Data = new GoogleDriveAuthorizeUrl(url),
            Message = "Open this URL to connect Google Drive"
        };
    }

    [HttpPost("shared-drive")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses])]
    public ApiWrapper.Success<GoogleDriveConnectionStatus> SaveSharedDrive(
        [FromBody] SaveSharedDriveRequest request
    )
    {
        googleAPIs.SaveSharedDriveId(request.SharedDriveId);
        return new()
        {
            Data = googleAPIs.GetDriveStatus(),
            Message = "Shared Drive saved"
        };
    }

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error,
        CancellationToken cancellationToken
    )
    {
        if (!string.IsNullOrWhiteSpace(error))
            return Content(CallbackHtml("Google Drive connection was cancelled."), "text/html");

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
            return Content(CallbackHtml("Missing Google authorization code."), "text/html");

        if (!PendingStates.TryRemove(state, out var expiresAt) || expiresAt < DateTimeOffset.UtcNow)
            return Content(CallbackHtml("This Google Drive connection link expired. Try again."), "text/html");

        try
        {
            await googleAPIs.CompleteDriveAuthorizationAsync(code, GetRedirectUri(), cancellationToken);
            return Content(CallbackHtml("Google Drive connected. You can close this window.", success: true), "text/html");
        }
        catch (ApiException ex)
        {
            return Content(CallbackHtml(ex.Error.Message), "text/html");
        }
    }

    private string GetRedirectUri()
    {
        var configured = options.Value.DriveRedirectUri;
        if (!string.IsNullOrWhiteSpace(configured))
            return configured.Trim();

        return $"{Request.Scheme}://{Request.Host}/api/google-drive/callback";
    }

    private static string CallbackHtml(string message, bool success = false)
    {
        var payload = success ? "drive-connected" : "drive-failed";
        return $$"""
            <!doctype html>
            <html>
            <body style="font-family: sans-serif; padding: 2rem;">
              <p>{{message}}</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage("{{payload}}", "*");
                  window.close();
                }
              </script>
            </body>
            </html>
            """;
    }
}

public sealed record GoogleDriveAuthorizeUrl(string Url);

public sealed class SaveSharedDriveRequest
{
    public string? SharedDriveId { get; set; }
}
