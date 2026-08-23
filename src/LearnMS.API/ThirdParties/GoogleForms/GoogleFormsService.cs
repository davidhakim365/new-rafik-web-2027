using System.Text.RegularExpressions;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Drive.v3;
using Google.Apis.Forms.v1;
using Google.Apis.Forms.v1.Data;
using Google.Apis.Services;
using Google.Apis.Http;
using Google.Apis.Upload;
using LearnMS.API.Common;
using Microsoft.Extensions.Options;
using DriveFile = Google.Apis.Drive.v3.Data.File;
using DrivePermission = Google.Apis.Drive.v3.Data.Permission;

namespace LearnMS.API.ThirdParties.GoogleForms;

public interface IGoogleFormsService
{
    bool IsConfigured { get; }
    Task<GoogleFormInfo> GetFormAsync(string formId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GoogleFormResponseScore>> ListResponseScoresAsync(
        string formId,
        string studentIdQuestionId,
        CancellationToken cancellationToken = default
    );
    Task<GoogleDriveUploadResult> UploadPublicPdfAsync(
        Stream content,
        string fileName,
        CancellationToken cancellationToken = default
    );
    GoogleDriveConnectionStatus GetDriveStatus();
    string CreateDriveAuthorizationUrl(string redirectUri, string state);
    Task<string> CompleteDriveAuthorizationAsync(string code, string redirectUri, CancellationToken cancellationToken = default);
    void SaveSharedDriveId(string? sharedDriveId);
    Task<IReadOnlyList<GoogleDriveFolder>> ListDriveFoldersAsync(CancellationToken cancellationToken = default);
    void SaveDriveFolder(string? folderId, string? folderName);
}

public sealed record GoogleDriveFolder(string Id, string Name, string Path);

public sealed record GoogleDriveConnectionStatus(
    bool CanUpload,
    bool CanConnectOAuth,
    string? Email,
    string? SharedDriveId,
    string Mode,
    string? RefreshToken,
    string? FolderId = null,
    string? FolderName = null
);

public sealed class GoogleFormsService : IGoogleFormsService
{
    public const string StudentIdQuestionTitle = "Student ID";

    private static readonly string[] Scopes =
    [
        FormsService.Scope.FormsBodyReadonly,
        FormsService.Scope.FormsResponsesReadonly
    ];

    private static readonly string[] DriveScopes =
    [
        DriveService.Scope.DriveFile,
        DriveService.Scope.Drive
    ];

    private static readonly Regex EditFormIdRegex =
        new(@"docs\.google\.com/forms/d/([a-zA-Z0-9_-]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly GoogleFormsConfig _config;
    private readonly GoogleDriveSettingsStore _driveSettings;

    public GoogleFormsService(IOptions<GoogleFormsConfig> options, GoogleDriveSettingsStore driveSettings)
    {
        _config = options.Value;
        _driveSettings = driveSettings;
    }

    public bool IsConfigured => _config.IsConfigured;

    public async Task<GoogleFormInfo> GetFormAsync(
        string formId,
        CancellationToken cancellationToken = default
    )
    {
        EnsureConfigured();
        var service = CreateService();
        var form = await service.Forms.Get(formId).ExecuteAsync(cancellationToken);

        var questions = new List<GoogleFormQuestion>();
        string? studentIdQuestionId = null;
        decimal totalPoints = 0;
        var hasGradedQuestion = false;

        foreach (var item in form.Items ?? [])
        {
            if (item.QuestionItem?.Question is { } singleQuestion)
            {
                var questionId = singleQuestion.QuestionId;
                var title = item.Title?.Trim() ?? "";
                if (string.IsNullOrWhiteSpace(questionId))
                    continue;

                questions.Add(new GoogleFormQuestion(questionId, title));

                if (
                    studentIdQuestionId is null
                    && string.Equals(title, StudentIdQuestionTitle, StringComparison.OrdinalIgnoreCase)
                )
                {
                    studentIdQuestionId = questionId;
                }

                if (singleQuestion.Grading?.PointValue is { } points)
                {
                    totalPoints += points;
                    hasGradedQuestion = true;
                }
            }

            if (item.QuestionGroupItem?.Questions is { } groupQuestions)
            {
                foreach (var groupQuestion in groupQuestions)
                {
                    var questionId = groupQuestion.QuestionId;
                    if (string.IsNullOrWhiteSpace(questionId))
                        continue;

                    questions.Add(new GoogleFormQuestion(questionId, item.Title?.Trim() ?? ""));

                    if (groupQuestion.Grading?.PointValue is { } points)
                    {
                        totalPoints += points;
                        hasGradedQuestion = true;
                    }
                }
            }
        }

        return new GoogleFormInfo(
            form.FormId ?? formId,
            form.Info?.Title,
            form.ResponderUri,
            studentIdQuestionId,
            questions,
            hasGradedQuestion ? totalPoints : null
        );
    }

    public async Task<IReadOnlyList<GoogleFormResponseScore>> ListResponseScoresAsync(
        string formId,
        string studentIdQuestionId,
        CancellationToken cancellationToken = default
    )
    {
        EnsureConfigured();
        var service = CreateService();
        var bestByCode = new Dictionary<string, GoogleFormResponseScore>(StringComparer.OrdinalIgnoreCase);
        string? pageToken = null;

        do
        {
            var request = service.Forms.Responses.List(formId);
            request.PageToken = pageToken;
            request.PageSize = 5000;
            var page = await request.ExecuteAsync(cancellationToken);

            foreach (var response in page.Responses ?? [])
            {
                if (response.Answers is null
                    || !response.Answers.TryGetValue(studentIdQuestionId, out var answer))
                    continue;

                var studentCode = answer.TextAnswers?.Answers?
                    .Select(a => a.Value?.Trim())
                    .FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));

                if (string.IsNullOrWhiteSpace(studentCode))
                    continue;

                if (response.TotalScore is null)
                    continue;

                var submitted = response.LastSubmittedTimeDateTimeOffset
                    ?? response.CreateTimeDateTimeOffset
                    ?? DateTimeOffset.MinValue;

                var score = new GoogleFormResponseScore(
                    studentCode,
                    Convert.ToDecimal(response.TotalScore.Value),
                    submitted
                );

                if (
                    !bestByCode.TryGetValue(studentCode, out var existing)
                    || score.LastSubmittedTime > existing.LastSubmittedTime
                )
                {
                    bestByCode[studentCode] = score;
                }
            }

            pageToken = page.NextPageToken;
        } while (!string.IsNullOrEmpty(pageToken));

        return bestByCode.Values.ToList();
    }

    public async Task<GoogleDriveUploadResult> UploadPublicPdfAsync(
        Stream content,
        string fileName,
        CancellationToken cancellationToken = default
    )
    {
        EnsureDriveUploadReady();

        var safeName = string.IsNullOrWhiteSpace(fileName) ? "document.pdf" : fileName.Trim();
        if (!safeName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            safeName += ".pdf";

        var local = _driveSettings.Read();
        var sharedDriveId = FirstNonEmpty(local.SharedDriveId, _config.SharedDriveId);
        var folderId = EffectiveFolderId(local);

        var metadata = new DriveFile
        {
            Name = safeName,
            MimeType = "application/pdf"
        };

        if (!string.IsNullOrWhiteSpace(folderId))
            metadata.Parents = [folderId];
        else if (!HasUserRefreshToken(local) && !HasImpersonateUser() && !string.IsNullOrWhiteSpace(sharedDriveId))
            metadata.Parents = [sharedDriveId];

        var service = await CreateDriveServiceAsync(cancellationToken);
        var create = service.Files.Create(metadata, content, "application/pdf");
        create.Fields = "id";
        create.SupportsAllDrives = true;

        var upload = await create.UploadAsync(cancellationToken);
        if (upload.Status != UploadStatus.Completed || string.IsNullOrWhiteSpace(create.ResponseBody?.Id))
        {
            var detail = upload.Exception?.Message ?? upload.Status.ToString();
            throw new ApiException(
                new ApiError(
                    "google-drive/upload-failed",
                    DriveUploadError(detail),
                    StatusCodes.Status502BadGateway
                )
            );
        }

        var fileId = create.ResponseBody.Id;
        var permission = new DrivePermission
        {
            Type = "anyone",
            Role = "reader",
            AllowFileDiscovery = false
        };

        var share = service.Permissions.Create(permission, fileId);
        share.SupportsAllDrives = true;
        await share.ExecuteAsync(cancellationToken);

        return new GoogleDriveUploadResult(
            fileId,
            $"https://drive.google.com/file/d/{fileId}/preview"
        );
    }

    public GoogleDriveConnectionStatus GetDriveStatus()
    {
        var local = _driveSettings.Read();
        var sharedDriveId = FirstNonEmpty(local.SharedDriveId, _config.SharedDriveId);
        var email = local.Email;

        var refreshToken = EffectiveRefreshToken(local);
        var folderId = EffectiveFolderId(local);
        var folderName = string.IsNullOrWhiteSpace(local.FolderName)
            ? (string.IsNullOrWhiteSpace(folderId) ? "My Drive" : folderId)
            : local.FolderName;
        if (!string.IsNullOrWhiteSpace(refreshToken))
            return new GoogleDriveConnectionStatus(true, _config.HasOAuthClient, email, sharedDriveId, "user", refreshToken, folderId, folderName);
        if (HasImpersonateUser())
            return new GoogleDriveConnectionStatus(true, _config.HasOAuthClient, _config.ImpersonateUser, sharedDriveId, "impersonate", null, folderId, folderName);
        if (!string.IsNullOrWhiteSpace(sharedDriveId) && IsConfigured)
            return new GoogleDriveConnectionStatus(true, _config.HasOAuthClient, null, sharedDriveId, "shared-drive", null, folderId, folderName);

        return new GoogleDriveConnectionStatus(false, _config.HasOAuthClient, null, sharedDriveId, "none", null, folderId, folderName);
    }

    public string CreateDriveAuthorizationUrl(string redirectUri, string state)
    {
        if (!_config.HasOAuthClient)
        {
            throw new ApiException(
                new ApiError(
                    "google-drive/oauth-not-configured",
                    "Set GoogleAPIs:DriveClientId and GoogleAPIs:DriveClientSecret, or paste a Shared Drive ID instead.",
                    StatusCodes.Status503ServiceUnavailable
                )
            );
        }

        var flow = CreateAuthFlow();
        var request = (Google.Apis.Auth.OAuth2.Requests.GoogleAuthorizationCodeRequestUrl)flow.CreateAuthorizationCodeRequest(redirectUri);
        request.AccessType = "offline";
        request.Prompt = "consent";
        request.State = state;
        return request.Build().AbsoluteUri;
    }

    public async Task<string> CompleteDriveAuthorizationAsync(
        string code,
        string redirectUri,
        CancellationToken cancellationToken = default
    )
    {
        var flow = CreateAuthFlow();
        var token = await flow.ExchangeCodeForTokenAsync("drive-user", code, redirectUri, cancellationToken);
        if (string.IsNullOrWhiteSpace(token.RefreshToken))
        {
            throw new ApiException(
                new ApiError(
                    "google-drive/oauth-no-refresh-token",
                    "Google did not return a refresh token. Disconnect the app from your Google account and connect again.",
                    StatusCodes.Status400BadRequest
                )
            );
        }

        var local = _driveSettings.Read();
        local.RefreshToken = token.RefreshToken;
        local.AccessToken = token.AccessToken;
        local.AccessTokenIssuedUtc = DateTime.UtcNow;

        var credential = new UserCredential(flow, "drive-user", token);
        var service = new DriveService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "LearnMS"
        });
        var aboutRequest = service.About.Get();
        aboutRequest.Fields = "user(emailAddress)";
        var about = await aboutRequest.ExecuteAsync(cancellationToken);
        local.Email = about.User?.EmailAddress;
        _driveSettings.Write(local);
        return local.RefreshToken!;
    }

    public void SaveSharedDriveId(string? sharedDriveId)
    {
        var local = _driveSettings.Read();
        local.SharedDriveId = ParseDriveId(sharedDriveId);
        _driveSettings.Write(local);
    }

    public async Task<IReadOnlyList<GoogleDriveFolder>> ListDriveFoldersAsync(
        CancellationToken cancellationToken = default
    )
    {
        var service = await CreateDriveServiceAsync(cancellationToken);
        var files = new List<DriveFile>();
        string? pageToken = null;
        var pages = 0;

        do
        {
            var request = service.Files.List();
            request.Q = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
            request.Fields = "nextPageToken, files(id, name, parents)";
            request.PageSize = 100;
            request.PageToken = pageToken;
            request.SupportsAllDrives = true;
            request.IncludeItemsFromAllDrives = true;
            request.Spaces = "drive";
            var result = await request.ExecuteAsync(cancellationToken);
            if (result.Files is { Count: > 0 })
                files.AddRange(result.Files);
            pageToken = result.NextPageToken;
            pages++;
        } while (!string.IsNullOrWhiteSpace(pageToken) && pages < 10);

        var byId = files
            .Where(file => !string.IsNullOrWhiteSpace(file.Id))
            .GroupBy(file => file.Id!)
            .ToDictionary(group => group.Key, group => group.First());

        string PathOf(DriveFile folder)
        {
            var parts = new List<string>();
            var current = folder;
            var seen = new HashSet<string>();
            while (current is { Id: { Length: > 0 } } && seen.Add(current.Id))
            {
                parts.Add(string.IsNullOrWhiteSpace(current.Name) ? "Untitled" : current.Name);
                var parentId = current.Parents?.FirstOrDefault();
                if (string.IsNullOrWhiteSpace(parentId) || !byId.TryGetValue(parentId, out current))
                    break;
            }

            parts.Reverse();
            return "My Drive / " + string.Join(" / ", parts);
        }

        var folders = files
            .Where(file => !string.IsNullOrWhiteSpace(file.Id))
            .Select(file => new GoogleDriveFolder(
                file.Id!,
                string.IsNullOrWhiteSpace(file.Name) ? "Untitled" : file.Name,
                PathOf(file)
            ))
            .OrderBy(file => file.Path, StringComparer.OrdinalIgnoreCase)
            .ToList();

        folders.Insert(0, new GoogleDriveFolder("root", "My Drive", "My Drive (root)"));
        return folders;
    }

    public void SaveDriveFolder(string? folderId, string? folderName)
    {
        var local = _driveSettings.Read();
        var parsed = ParseDriveId(folderId);
        if (string.IsNullOrWhiteSpace(parsed) || parsed == "root")
        {
            local.FolderId = null;
            local.FolderName = "My Drive";
        }
        else
        {
            local.FolderId = parsed;
            local.FolderName = string.IsNullOrWhiteSpace(folderName) ? parsed : folderName.Trim();
        }

        _driveSettings.Write(local);
    }

    private static string? ParseDriveId(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return null;

        var trimmed = input.Trim();
        var folder = Regex.Match(trimmed, @"/folders/([a-zA-Z0-9_-]+)");
        if (folder.Success)
            return folder.Groups[1].Value;

        var query = Regex.Match(trimmed, @"[?&]id=([a-zA-Z0-9_-]+)");
        if (query.Success)
            return query.Groups[1].Value;

        return trimmed;
    }

    public static string? TryParseFormId(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return null;

        var trimmed = input.Trim();

        if (trimmed.Contains("/forms/d/e/", StringComparison.OrdinalIgnoreCase))
            return null;

        var match = EditFormIdRegex.Match(trimmed);
        if (match.Success)
            return match.Groups[1].Value;

        if (Regex.IsMatch(trimmed, @"^[a-zA-Z0-9_-]{10,}$"))
            return trimmed;

        return null;
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
        {
            throw new ApiException(
                new ApiError(
                    "google-forms/not-configured",
                    "Google Forms is not configured. Set GoogleAPIs:ClientEmail and GoogleAPIs:PrivateKey.",
                    StatusCodes.Status503ServiceUnavailable
                )
            );
        }
    }

    private void EnsureDriveUploadReady()
    {
        var status = GetDriveStatus();
        if (status.CanUpload)
            return;

        if (_config.HasOAuthClient)
        {
            throw new ApiException(
                new ApiError(
                    "google-drive/not-connected",
                    "Google Drive is not connected yet. Open Add PDF and click Connect Google account, then sign in with your Gmail. Setting env vars alone is not enough.",
                    StatusCodes.Status400BadRequest
                )
            );
        }

        throw new ApiException(
            new ApiError(
                "google-drive/not-connected",
                "Google service accounts have no Drive storage. Connect your Google account, or create a Shared Drive, add the service account as Content manager, and paste the Shared Drive ID.",
                StatusCodes.Status400BadRequest
            )
        );
    }

    private static string DriveUploadError(string detail)
    {
        if (detail.Contains("storage quota", StringComparison.OrdinalIgnoreCase)
            || detail.Contains("Service Accounts do not have storage quota", StringComparison.OrdinalIgnoreCase))
        {
            return "Google service accounts have no Drive storage. Connect your own Google account, or upload into a Shared Drive.";
        }

        return $"Failed to upload the PDF to Google Drive. {detail}";
    }

    private ServiceAccountCredential CreateCredential(params string[] scopes)
    {
        var privateKey = _config.PrivateKey.Replace("\\n", "\n", StringComparison.Ordinal);
        var initializer = new ServiceAccountCredential.Initializer(_config.ClientEmail)
        {
            Scopes = scopes
        };

        if (HasImpersonateUser())
            initializer.User = _config.ImpersonateUser!.Trim();

        return new ServiceAccountCredential(initializer.FromPrivateKey(privateKey));
    }

    private async Task<DriveService> CreateDriveServiceAsync(CancellationToken cancellationToken)
    {
        var local = _driveSettings.Read();
        IConfigurableHttpClientInitializer initializer;
        var refreshToken = EffectiveRefreshToken(local);

        if (!string.IsNullOrWhiteSpace(refreshToken) && _config.HasOAuthClient)
        {
            var flow = CreateAuthFlow();
            var credential = new UserCredential(
                flow,
                "drive-user",
                new TokenResponse
                {
                    RefreshToken = refreshToken,
                    AccessToken = local.AccessToken,
                    IssuedUtc = local.AccessTokenIssuedUtc ?? DateTime.UtcNow.AddHours(-2)
                }
            );

            if (string.IsNullOrWhiteSpace(credential.Token.AccessToken) || credential.Token.IsStale)
            {
                await credential.RefreshTokenAsync(cancellationToken);
                local.AccessToken = credential.Token.AccessToken;
                local.AccessTokenIssuedUtc = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(credential.Token.RefreshToken))
                    local.RefreshToken = credential.Token.RefreshToken;
                _driveSettings.Write(local);
            }

            initializer = credential;
        }
        else
        {
            EnsureConfigured();
            initializer = CreateCredential(DriveService.Scope.Drive);
        }

        return new DriveService(
            new BaseClientService.Initializer
            {
                HttpClientInitializer = initializer,
                ApplicationName = "LearnMS"
            }
        );
    }

    private GoogleAuthorizationCodeFlow CreateAuthFlow()
    {
        return new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = new ClientSecrets
            {
                ClientId = _config.DriveClientId,
                ClientSecret = _config.DriveClientSecret
            },
            Scopes = DriveScopes
        });
    }

    private FormsService CreateService()
    {
        var credential = CreateCredential(Scopes);

        return new FormsService(
            new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "LearnMS"
            }
        );
    }

    private string? EffectiveRefreshToken(GoogleDriveLocalSettings local) =>
        FirstNonEmpty(local.RefreshToken, _config.DriveRefreshToken);

    private string? EffectiveFolderId(GoogleDriveLocalSettings local)
    {
        var selected = local.FolderId;
        if (string.Equals(selected, "root", StringComparison.OrdinalIgnoreCase))
            selected = null;
        return FirstNonEmpty(selected, _config.DriveFolderId);
    }

    private bool HasUserRefreshToken(GoogleDriveLocalSettings local) =>
        !string.IsNullOrWhiteSpace(EffectiveRefreshToken(local));

    private bool HasImpersonateUser() =>
        !string.IsNullOrWhiteSpace(_config.ImpersonateUser) && _config.ImpersonateUser != "*";

    private static string? FirstNonEmpty(params string?[] values) =>
        values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));
}
