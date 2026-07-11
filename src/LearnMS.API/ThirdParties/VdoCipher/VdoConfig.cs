namespace LearnMS.API.ThirdParties.VdoCipher;

public sealed class VdoConfig
{
    public const string Section = "VdoCipher";
    public required string ApiSecret { get; init; }
}