using System.Collections.Concurrent;
using System.Text.Encodings.Web;
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
            var refreshToken = await googleAPIs.CompleteDriveAuthorizationAsync(
                code,
                GetRedirectUri(),
                cancellationToken
            );
            return Content(CallbackHtml("Google Drive connected.", success: true, refreshToken: refreshToken), "text/html");
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

    private static string CallbackHtml(string message, bool success = false, string? refreshToken = null)
    {
        var payload = success ? "drive-connected" : "drive-failed";
        var safeMessage = HtmlEncoder.Default.Encode(message);
        var envLine = string.IsNullOrWhiteSpace(refreshToken)
            ? ""
            : HtmlEncoder.Default.Encode($"GoogleForms__DriveRefreshToken={refreshToken}");
        var tokenBlock = string.IsNullOrWhiteSpace(refreshToken)
            ? "<p>You can close this window.</p>"
            : $$"""
              <p style="margin-top:1.5rem;font-weight:600;">Your refresh token (copy this now):</p>
              <textarea id="token" readonly style="width:100%;min-height:8rem;font-family:monospace;font-size:12px;padding:8px;">{{envLine}}</textarea>
              <p>
                <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('token').value).then(() => { this.textContent = 'Copied'; })" style="margin-top:8px;padding:8px 12px;">
                  Copy refresh token
                </button>
              </p>
              <p>Paste it into env, then you will not need to connect again. Close this window after copying.</p>
              """;
        var messageJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            type = payload,
            refreshToken = refreshToken ?? ""
        });

        return $$"""
            <!doctype html>
            <html>
            <body style="font-family: sans-serif; padding: 2rem; max-width: 640px;">
              <p>{{safeMessage}}</p>
              {{tokenBlock}}
              <script>
                document.getElementById("token")?.focus();
                document.getElementById("token")?.select();
                if (window.opener) {
                  window.opener.postMessage({{messageJson}}, "*");
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
