namespace LearnMS.API.ThirdParties.GoogleForms;

public sealed class GoogleFormsConfig
{
    public const string Section = "GoogleForms";
    public string ClientEmail { get; set; } = "";
    public string PrivateKey { get; set; } = "";
    public string? ProjectId { get; set; }

    /// <summary>
    /// Optional Drive folder ID. Share that folder with ClientEmail as Editor
    /// so uploaded lecture PDFs appear in your Google Drive.
    /// </summary>
    public string? DriveFolderId { get; set; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ClientEmail)
        && ClientEmail != "*"
        && !string.IsNullOrWhiteSpace(PrivateKey)
        && PrivateKey != "*";
}
