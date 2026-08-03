using System.Text.RegularExpressions;

namespace LearnMS.API.Common;

public static class PhoneNumbers
{
    public static string Normalize(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return string.Empty;

        var digits = Regex.Replace(phone, @"[^\d]", "");

        if (digits.StartsWith("0020") && digits.Length > 4)
            digits = digits[4..];
        else if (digits.StartsWith("20") && digits.Length > 10)
            digits = digits[2..];

        if (digits.StartsWith("0") == false && digits.Length == 10)
            digits = "0" + digits;

        return digits;
    }

    public static bool AreSame(string? phoneA, string? phoneB)
    {
        var a = Normalize(phoneA);
        var b = Normalize(phoneB);
        return !string.IsNullOrEmpty(a) && a == b;
    }
}
