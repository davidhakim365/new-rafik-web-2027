using System.Globalization;
using System.Text;

namespace LearnMS.API.Common;

public static class ScanCodes
{
    /// <summary>
    /// Strips barcode-decoder junk (GS1 FNC1 / ASCII 29, other control chars)
    /// that camera scanners append after the real student code.
    /// </summary>
    public static string Normalize(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return string.Empty;

        var sb = new StringBuilder(code.Length);
        foreach (var c in code.Trim())
        {
            var category = char.GetUnicodeCategory(c);
            if (char.IsControl(c) || category is UnicodeCategory.Format or UnicodeCategory.Surrogate)
                continue;
            sb.Append(c);
        }

        var cleaned = sb.ToString().Trim();
        return TrimNonAlphanumericEdges(cleaned);
    }

    private static string TrimNonAlphanumericEdges(string value)
    {
        var start = 0;
        var end = value.Length - 1;

        while (start <= end && !char.IsLetterOrDigit(value[start]))
            start++;
        while (end >= start && !char.IsLetterOrDigit(value[end]))
            end--;

        return start > end ? string.Empty : value[start..(end + 1)];
    }
}
