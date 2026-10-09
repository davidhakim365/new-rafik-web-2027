using System.Text.Json;

namespace LearnMS.API.Features.AssistantTraces;

public static class AssistantTraceDescription
{
    public static bool ShouldSkip(string path)
    {
        var key = Key(path);
        return key.StartsWith("auth/", StringComparison.Ordinal)
               || key.StartsWith("parent/", StringComparison.Ordinal)
               || key.StartsWith("assistant-traces", StringComparison.Ordinal)
               || key.EndsWith("/lookup", StringComparison.Ordinal)
               || key.EndsWith("/video/policy", StringComparison.Ordinal)
               || key.EndsWith("/video/validate", StringComparison.Ordinal);
    }

    public static string Describe(string method, string path)
    {
        var verb = method.ToUpperInvariant();
        var key = Key(path);

        return (verb, key) switch
        {
            ("POST", "courses") => "Created a course",
            ("PATCH", "courses") => "Updated a course",
            ("DELETE", "courses") => "Deleted a course",
            ("POST", "courses/publish") => "Published a course",
            ("POST", "courses/unpublish") => "Unpublished a course",
            ("POST", "courses/buy") => "Bought a course",

            ("POST", "courses/lectures") => "Created a lecture",
            ("PATCH", "courses/lectures") => "Updated a lecture",
            ("DELETE", "courses/lectures") => "Deleted a lecture",
            ("PUT", "courses/lectures/toggle-important") => "Changed whether a lecture is important",
            ("POST", "courses/lectures/publish") => "Published a lecture",
            ("POST", "courses/lectures/unpublish") => "Unpublished a lecture",
            ("POST", "courses/lectures/publish-attachments") => "Published lecture attachments",
            ("POST", "courses/lectures/unpublish-attachments") => "Unpublished lecture attachments",
            ("PUT", "courses/lectures/students/homework") => "Saved a homework score",
            ("PUT", "courses/lectures/students/quiz") => "Saved a quiz score",
            ("POST", "courses/lectures/choose-homework/sync") => "Synced choose-homework scores",
            ("POST", "courses/lectures/choose-homework/import") => "Imported choose-homework scores",
            ("PUT", "courses/lectures/assets") => "Updated lecture files",
            ("PUT", "courses/lectures/quiz-answers") => "Saved quiz answers",
            ("PUT", "courses/lectures/items/order") => "Reordered lecture items",
            ("POST", "courses/lectures/pdf-links") => "Added lecture PDF links",
            ("POST", "courses/lectures/pdfs") => "Added lecture PDFs",
            ("POST", "courses/lectures/students/attend") => "Marked a student present",
            ("POST", "courses/lectures/students/toggle-attendance") => "Changed attendance",
            ("POST", "courses/lectures/students/enroll") => "Enrolled a student in a lecture",
            ("POST", "courses/lectures/grades") => "Saved lecture grades",
            ("POST", "courses/lectures/buy") => "Bought a lecture",

            ("POST", "courses/lectures/lessons") => "Created a lesson",
            ("PATCH", "courses/lectures/lessons") => "Updated a lesson",
            ("DELETE", "courses/lectures/lessons") => "Deleted a lesson",
            ("POST", "courses/lectures/lessons/start") => "Started a lesson",
            ("POST", "courses/lectures/lessons/renew") => "Renewed a lesson",
            ("POST", "courses/lectures/lessons/video/upload") => "Uploaded a lesson video",

            ("PUT", "courses/lectures/quizzes") => "Saved a quiz",
            ("DELETE", "courses/lectures/quizzes") => "Deleted a quiz",
            ("POST", "courses/lectures/quizzes/submit") => "Submitted a quiz",
            ("POST", "courses/lectures/quizzes/retake") => "Allowed a quiz retake",
            ("POST", "courses/lectures/quizzes/start") => "Started a quiz",
            ("POST", "courses/lectures/quizzes/grade-essay") => "Graded a quiz essay",

            ("PUT", "courses/exams") => "Saved an exam",
            ("DELETE", "courses/exams") => "Deleted an exam",
            ("POST", "courses/exams/buy") => "Bought an exam",
            ("POST", "courses/exams/submit") => "Submitted an exam",
            ("POST", "courses/exams/students/enroll") => "Enrolled a student in an exam",
            ("POST", "courses/exams/grade-essay") => "Graded an exam essay",

            ("POST", "discounts") => "Assigned a student discount",
            ("PATCH", "discounts") => "Updated a student discount",
            ("DELETE", "discounts") => "Removed a student discount",
            ("POST", "discounts/lectures") => "Assigned a lecture discount",
            ("PATCH", "discounts/lecture-discounts") => "Updated a lecture discount",
            ("DELETE", "discounts/lecture-discounts") => "Removed a lecture discount",

            ("POST", "students") => "Added a student",
            ("DELETE", "students") => "Deleted a student",
            ("PATCH", "students") => "Updated a student",
            ("PUT", "students/registration-settings") => "Changed student sign-up settings",
            ("POST", "students/credit") => "Added student credit",
            ("POST", "students/apples") => "Changed student apples",
            ("POST", "students/unlink-device") => "Unlinked a student device",
            ("PUT", "students/block") => "Changed a student block",
            ("POST", "students/unlink-all-devices") => "Unlinked every student device",
            ("PATCH", "students/lectures/enrollment") => "Changed lecture expiration",

            ("POST", "administration/assistants") => "Created an assistant",
            ("DELETE", "administration/assistants") => "Deleted an assistant",
            ("PATCH", "administration/assistants") => "Updated an assistant",
            ("POST", "administration/assistants/claim") => "Claimed assistant income",
            ("POST", "administration/teachers") => "Created a teacher account",

            ("POST", "rewards/assistants/attend-session") => "Recorded an assistant session",
            ("POST", "rewards/assistants/attend-by-code") => "Recorded an assistant session",
            ("POST", "rewards/assistants/apples") => "Changed assistant apples",
            ("POST", "rewards/assistants/pay-rewards") => "Paid assistant rewards",
            ("POST", "rewards/students/apples-by-code") => "Gave a student apples",
            ("PUT", "rewards/system-settings") => "Updated reward settings",
            ("PUT", "rewards/store/settings") => "Updated the apple rewards store",
            ("POST", "rewards/store/items") => "Added a store reward",
            ("PUT", "rewards/store/items") => "Updated a store reward",
            ("DELETE", "rewards/store/items") => "Removed a store reward",
            ("POST", "rewards/store/orders/cancel") => "Cancelled a reward order",

            ("PUT", "call-center/courses/lectures/students") => "Updated a call center record",
            ("POST", "call-center/courses/lectures/students/notify") => "Sent a call center notification",
            ("PUT", "call-center/students/block") => "Blocked a student from the call center",

            ("POST", "payment-requests/confirm") => "Confirmed a payment",
            ("POST", "payment-requests/reject") => "Rejected a payment",
            ("POST", "payment-requests/rejection-reasons") => "Saved a payment rejection reason",
            ("POST", "payment-requests") => "Created a payment request",

            ("POST", "credit-codes") => "Generated credit codes",
            ("PUT", "credit-codes/redeem") => "Redeemed a credit code",
            ("POST", "credit-codes/sell") => "Sold a credit code",

            ("POST", "questions") => "Created a question",
            ("PUT", "questions") => "Updated a question",
            ("DELETE", "questions") => "Deleted a question",

            ("PATCH", "profile") => "Updated their profile",
            ("POST", "uploads/imgbb") => "Uploaded an image",
            ("POST", "assets/delete") => "Deleted a file",
            ("PUT", "assets") => "Updated a file",
            ("POST", "google-drive/shared-drive") => "Connected a Google Drive",
            ("POST", "google-drive/folder") => "Created a Google Drive folder",
            ("POST", "centers") => "Saved a center",

            _ => Fallback(verb, key)
        };
    }

    public static (Guid? CourseId, Guid? LectureId, Guid? StudentId, string? StudentCode) ExtractIds(string path)
    {
        var segments = Segments(path);
        return (
            IdAfter(segments, "courses"),
            IdAfter(segments, "lectures"),
            IdAfter(segments, "students"),
            CodeAfter(segments, "students"));
    }

    public static void ReadIdsFromBody(
        string? body,
        ref Guid? courseId,
        ref Guid? lectureId,
        ref Guid? studentId)
    {
        if (string.IsNullOrWhiteSpace(body))
            return;

        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return;

            courseId ??= ReadGuid(doc.RootElement, "courseId");
            lectureId ??= ReadGuid(doc.RootElement, "lectureId");
            studentId ??= ReadGuid(doc.RootElement, "studentId");
        }
        catch (JsonException)
        {
            // Body is not JSON we can use for ids.
        }
    }

    public static string? BuildDetail(string? body)
    {
        if (string.IsNullOrWhiteSpace(body))
            return null;

        try
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;
            if (root.ValueKind == JsonValueKind.Array)
                return root.GetArrayLength() == 1 ? "1 item" : $"{root.GetArrayLength()} items";

            if (root.ValueKind != JsonValueKind.Object)
                return null;

            var parts = new List<string>();
            foreach (var prop in root.EnumerateObject())
            {
                var text = FormatField(prop.Name, prop.Value);
                if (text is null)
                    continue;
                parts.Add(text);
                if (parts.Count == 4)
                    break;
            }

            return parts.Count == 0 ? null : string.Join(" · ", parts);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string Key(string path)
    {
        var parts = Segments(path)
            .Where(segment => !segment.Equals("api", StringComparison.OrdinalIgnoreCase))
            .Where(segment => !IsId(segment))
            .Select(segment => segment.ToLowerInvariant());
        return string.Join('/', parts);
    }

    private static string[] Segments(string path)
    {
        return path.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    private static bool IsId(string segment)
    {
        return Guid.TryParse(segment, out _) || segment.All(char.IsDigit);
    }

    private static Guid? IdAfter(string[] segments, string name)
    {
        for (var i = 0; i < segments.Length - 1; i++)
        {
            if (segments[i].Equals(name, StringComparison.OrdinalIgnoreCase)
                && Guid.TryParse(segments[i + 1], out var id))
                return id;
        }

        return null;
    }

    private static string? CodeAfter(string[] segments, string name)
    {
        for (var i = 0; i < segments.Length - 1; i++)
        {
            if (!segments[i].Equals(name, StringComparison.OrdinalIgnoreCase))
                continue;
            var token = segments[i + 1];
            if (!token.All(char.IsDigit))
                return null;
            return token;
        }

        return null;
    }

    private static Guid? ReadGuid(JsonElement root, string name)
    {
        foreach (var prop in root.EnumerateObject())
        {
            if (!prop.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
                continue;
            if (prop.Value.ValueKind == JsonValueKind.String
                && Guid.TryParse(prop.Value.GetString(), out var id))
                return id;
        }

        return null;
    }

    private static string? FormatField(string name, JsonElement value)
    {
        var key = name.ToLowerInvariant();
        if (key is "password" or "passwordhash" or "token" or "refreshtoken" or "accesstoken"
            or "imageurl" or "profilepicture" or "description" or "homeworkvideourl"
            or "content" or "file" or "video")
            return null;

        if (value.ValueKind == JsonValueKind.Array)
        {
            var count = value.GetArrayLength();
            return key switch
            {
                "studentids" or "students" => count == 1 ? "1 student" : $"{count} students",
                "permissions" => count == 1 ? "1 permission" : $"{count} permissions",
                _ => null
            };
        }

        if (key == "percentage" && value.TryGetDecimal(out var percentage))
            return $"{percentage}%";

        if (value.ValueKind == JsonValueKind.Number && key is "price" or "renewalprice" or "amount" or "apples" or "score" or "mark")
            return $"{Humanize(key)} {value.GetRawText()}";

        if (value.ValueKind != JsonValueKind.String)
            return null;

        var text = value.GetString();
        if (string.IsNullOrWhiteSpace(text) || text.Length > 80)
            return null;

        return key switch
        {
            "title" or "fullname" or "name" or "email" or "level" or "appliesto" or "studentcode" or "code" => text.Trim(),
            _ => null
        };
    }

    private static string Fallback(string verb, string key)
    {
        var action = verb switch
        {
            "POST" => "Created",
            "PUT" or "PATCH" => "Updated",
            "DELETE" => "Deleted",
            _ => verb
        };
        var last = key.Split('/').LastOrDefault();
        var label = string.IsNullOrWhiteSpace(last) ? "an item" : Humanize(last);
        return $"{action} {label}";
    }

    private static string Humanize(string value)
    {
        return value.Replace('-', ' ');
    }
}
