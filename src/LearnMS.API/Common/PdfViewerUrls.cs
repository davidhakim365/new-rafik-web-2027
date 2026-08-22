using System.Text.RegularExpressions;

namespace LearnMS.API.Common;

public static class PdfViewerUrls
{
    private static readonly Regex FileIdInPath =
        new(@"drive\.google\.com/file/d/([a-zA-Z0-9_-]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex FileIdInQuery =
        new(@"[?&]id=([a-zA-Z0-9_-]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static string ToPublicViewerUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return url;

        var trimmed = url.Trim();
        if (trimmed.Contains("/preview", StringComparison.OrdinalIgnoreCase))
            return trimmed;

        var pathMatch = FileIdInPath.Match(trimmed);
        if (pathMatch.Success)
            return $"https://drive.google.com/file/d/{pathMatch.Groups[1].Value}/preview";

        if (trimmed.Contains("drive.google.com", StringComparison.OrdinalIgnoreCase))
        {
            var queryMatch = FileIdInQuery.Match(trimmed);
            if (queryMatch.Success)
                return $"https://drive.google.com/file/d/{queryMatch.Groups[1].Value}/preview";
        }

        return trimmed;
    }
}
