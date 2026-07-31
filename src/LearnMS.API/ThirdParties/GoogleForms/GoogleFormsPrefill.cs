using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.WebUtilities;

namespace LearnMS.API.ThirdParties.GoogleForms;

public sealed record GoogleFormPrefillEntries(string? StudentIdEntryId, string? NameEntryId);

public static class GoogleFormsPrefill
{
    private static readonly HashSet<string> StudentIdTitles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Student ID",
        "Student Id",
        "StudentID",
        "رقم الطالب",
        "كود الطالب"
    };

    private static readonly HashSet<string> NameTitles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Name",
        "Full Name",
        "Student Name",
        "Your Name",
        "الاسم",
        "اسم الطالب",
        "الاسم بالكامل",
        "الاسم ثلاثي"
    };

    // Google Forms public HTML: [itemId, "Title", ..., [[entryId, ...
    private static readonly Regex EntryFromDataParamsRegex = new(
        @"\[\d+\s*,\s*\\?""(?<title>[^\\""]+)\\?""[^\[]{0,400}?\[\[(?<entry>\d+)\s*,",
        RegexOptions.Compiled | RegexOptions.CultureInvariant
    );

    private static readonly Regex EntryFromDataParamsRegexPlain = new(
        @"\[\d+\s*,\s*""(?<title>[^""]+)""[^\[]{0,400}?\[\[(?<entry>\d+)\s*,",
        RegexOptions.Compiled | RegexOptions.CultureInvariant
    );

    public static async Task<GoogleFormPrefillEntries> ResolveEntryIdsAsync(
        HttpClient httpClient,
        string formUrl,
        CancellationToken cancellationToken = default
    )
    {
        if (string.IsNullOrWhiteSpace(formUrl))
            return new GoogleFormPrefillEntries(null, null);

        using var response = await httpClient.GetAsync(formUrl, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new GoogleFormPrefillEntries(null, null);

        var html = await response.Content.ReadAsStringAsync(cancellationToken);
        return ParseEntryIds(html);
    }

    public static GoogleFormPrefillEntries ParseEntryIds(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return new GoogleFormPrefillEntries(null, null);

        string? studentIdEntry = null;
        string? nameEntry = null;

        foreach (Match match in EntryFromDataParamsRegex.Matches(html).Cast<Match>()
                     .Concat(EntryFromDataParamsRegexPlain.Matches(html).Cast<Match>()))
        {
            var title = WebUtility.HtmlDecode(match.Groups["title"].Value).Trim();
            var entry = match.Groups["entry"].Value;

            if (studentIdEntry is null && StudentIdTitles.Contains(title))
                studentIdEntry = entry;

            if (nameEntry is null && NameTitles.Contains(title))
                nameEntry = entry;

            if (studentIdEntry is not null && nameEntry is not null)
                break;
        }

        return new GoogleFormPrefillEntries(studentIdEntry, nameEntry);
    }

    public static string? ApplyPrefill(
        string? formUrl,
        string? studentIdEntryId,
        string? nameEntryId,
        string? studentCode,
        string? fullName
    )
    {
        if (string.IsNullOrWhiteSpace(formUrl))
            return formUrl;

        if (string.IsNullOrWhiteSpace(studentIdEntryId) && string.IsNullOrWhiteSpace(nameEntryId))
            return formUrl;

        if (!Uri.TryCreate(formUrl.Trim(), UriKind.Absolute, out var uri))
            return formUrl;

        var query = QueryHelpers.ParseQuery(uri.Query)
            .ToDictionary(k => k.Key, v => v.Value.ToString(), StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(studentIdEntryId) && !string.IsNullOrWhiteSpace(studentCode))
            query[$"entry.{studentIdEntryId}"] = studentCode.Trim();

        if (!string.IsNullOrWhiteSpace(nameEntryId) && !string.IsNullOrWhiteSpace(fullName))
            query[$"entry.{nameEntryId}"] = fullName.Trim();

        query["usp"] = "pp_url";

        var path = uri.GetLeftPart(UriPartial.Path);
        return QueryHelpers.AddQueryString(path, query!);
    }
}
