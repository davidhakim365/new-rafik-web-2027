using System.Text.Json;
using Microsoft.Extensions.Hosting;

namespace LearnMS.API.ThirdParties.GoogleForms;

public sealed class GoogleDriveLocalSettings
{
    public string? RefreshToken { get; set; }
    public string? Email { get; set; }
    public string? SharedDriveId { get; set; }
}

public sealed class GoogleDriveSettingsStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly string _path;
    private readonly object _gate = new();

    public GoogleDriveSettingsStore(IHostEnvironment environment)
    {
        var directory = Path.Combine(environment.ContentRootPath, "App_Data");
        Directory.CreateDirectory(directory);
        _path = Path.Combine(directory, "google-drive.json");
    }

    public GoogleDriveLocalSettings Read()
    {
        lock (_gate)
        {
            if (!File.Exists(_path))
                return new GoogleDriveLocalSettings();

            var json = File.ReadAllText(_path);
            return JsonSerializer.Deserialize<GoogleDriveLocalSettings>(json, JsonOptions)
                ?? new GoogleDriveLocalSettings();
        }
    }

    public void Write(GoogleDriveLocalSettings settings)
    {
        lock (_gate)
        {
            File.WriteAllText(_path, JsonSerializer.Serialize(settings, JsonOptions));
        }
    }
}
