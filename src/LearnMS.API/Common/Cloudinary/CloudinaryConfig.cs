namespace LearnMS.API.Common.Cloudinary;

public sealed class CloudinaryConfig
{
    public const string Section = "Cloudinary";

    public string CloudName { get; set; } = "";
    public string ApiKey { get; set; } = "";
    public string ApiSecret { get; set; } = "";
    public string Folder { get; set; } = "rafik";
}
