namespace LearnMS.API.ThirdParties.GoogleForms;

public sealed class GoogleFormsConfig
{
    public const string Section = "GoogleForms";
    public string ClientEmail { get; set; } = "";
    public string PrivateKey { get; set; } = "";
    public string? ProjectId { get; set; }

    /// <summary>Optional folder inside My Drive or a Shared Drive.</summary>
    public string? DriveFolderId { get; set; }

    /// <summary>
    /// Shared Drive ID. Service accounts can only store files here, not in My Drive.
    /// </summary>
    public string? SharedDriveId { get; set; }

    /// <summary>
    /// Workspace user to impersonate with domain-wide delegation.
    /// </summary>
    public string? ImpersonateUser { get; set; }

    public string? DriveClientId { get; set; }
    public string? DriveClientSecret { get; set; }
    public string? DriveRedirectUri { get; set; }
    public string? DriveRefreshToken { get; set; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ClientEmail)
        && ClientEmail != "*"
        && !string.IsNullOrWhiteSpace(PrivateKey)
        && PrivateKey != "*";

    public bool HasOAuthClient =>
        !string.IsNullOrWhiteSpace(DriveClientId)
        && DriveClientId != "*"
        && !string.IsNullOrWhiteSpace(DriveClientSecret)
        && DriveClientSecret != "*";
}
