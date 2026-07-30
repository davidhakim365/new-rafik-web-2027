using System.Text.RegularExpressions;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Forms.v1;
using Google.Apis.Forms.v1.Data;
using Google.Apis.Services;
using LearnMS.API.Common;
using Microsoft.Extensions.Options;

namespace LearnMS.API.ThirdParties.GoogleForms;

public interface IGoogleFormsService
{
    bool IsConfigured { get; }
    Task<GoogleFormInfo> GetFormAsync(string formId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GoogleFormResponseScore>> ListResponseScoresAsync(
        string formId,
        string studentIdQuestionId,
        CancellationToken cancellationToken = default
    );
}

public sealed class GoogleFormsService : IGoogleFormsService
{
    public const string StudentIdQuestionTitle = "Student ID";

    private static readonly string[] Scopes =
    [
        FormsService.Scope.FormsBodyReadonly,
        FormsService.Scope.FormsResponsesReadonly
    ];

    private static readonly Regex EditFormIdRegex =
        new(@"docs\.google\.com/forms/d/([a-zA-Z0-9_-]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly GoogleFormsConfig _config;

    public GoogleFormsService(IOptions<GoogleFormsConfig> options)
    {
        _config = options.Value;
    }

    public bool IsConfigured => _config.IsConfigured;

    public async Task<GoogleFormInfo> GetFormAsync(
        string formId,
        CancellationToken cancellationToken = default
    )
    {
        EnsureConfigured();
        var service = CreateService();
        var form = await service.Forms.Get(formId).ExecuteAsync(cancellationToken);

        var questions = new List<GoogleFormQuestion>();
        string? studentIdQuestionId = null;

        foreach (var item in form.Items ?? [])
        {
            if (item.QuestionItem?.Question is null)
                continue;

            var questionId = item.QuestionItem.Question.QuestionId;
            var title = item.Title?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(questionId))
                continue;

            questions.Add(new GoogleFormQuestion(questionId, title));

            if (
                studentIdQuestionId is null
                && string.Equals(title, StudentIdQuestionTitle, StringComparison.OrdinalIgnoreCase)
            )
            {
                studentIdQuestionId = questionId;
            }
        }

        return new GoogleFormInfo(
            form.FormId ?? formId,
            form.Info?.Title,
            form.ResponderUri,
            studentIdQuestionId,
            questions
        );
    }

    public async Task<IReadOnlyList<GoogleFormResponseScore>> ListResponseScoresAsync(
        string formId,
        string studentIdQuestionId,
        CancellationToken cancellationToken = default
    )
    {
        EnsureConfigured();
        var service = CreateService();
        var bestByCode = new Dictionary<string, GoogleFormResponseScore>(StringComparer.OrdinalIgnoreCase);
        string? pageToken = null;

        do
        {
            var request = service.Forms.Responses.List(formId);
            request.PageToken = pageToken;
            request.PageSize = 5000;
            var page = await request.ExecuteAsync(cancellationToken);

            foreach (var response in page.Responses ?? [])
            {
                if (response.Answers is null
                    || !response.Answers.TryGetValue(studentIdQuestionId, out var answer))
                    continue;

                var studentCode = answer.TextAnswers?.Answers?
                    .Select(a => a.Value?.Trim())
                    .FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));

                if (string.IsNullOrWhiteSpace(studentCode))
                    continue;

                if (response.TotalScore is null)
                    continue;

                var submitted = response.LastSubmittedTimeDateTimeOffset
                    ?? response.CreateTimeDateTimeOffset
                    ?? DateTimeOffset.MinValue;

                var score = new GoogleFormResponseScore(
                    studentCode,
                    Convert.ToDecimal(response.TotalScore.Value),
                    submitted
                );

                if (
                    !bestByCode.TryGetValue(studentCode, out var existing)
                    || score.LastSubmittedTime > existing.LastSubmittedTime
                )
                {
                    bestByCode[studentCode] = score;
                }
            }

            pageToken = page.NextPageToken;
        } while (!string.IsNullOrEmpty(pageToken));

        return bestByCode.Values.ToList();
    }

    public static string? TryParseFormId(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return null;

        var trimmed = input.Trim();

        // Reject public /e/ viewform IDs — Forms API needs the edit form ID.
        if (trimmed.Contains("/forms/d/e/", StringComparison.OrdinalIgnoreCase))
            return null;

        var match = EditFormIdRegex.Match(trimmed);
        if (match.Success)
            return match.Groups[1].Value;

        if (Regex.IsMatch(trimmed, @"^[a-zA-Z0-9_-]{10,}$"))
            return trimmed;

        return null;
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
        {
            throw new ApiException(
                new ApiError(
                    "google-forms/not-configured",
                    "Google Forms is not configured. Set GoogleForms:ClientEmail and GoogleForms:PrivateKey.",
                    StatusCodes.Status503ServiceUnavailable
                )
            );
        }
    }

    private FormsService CreateService()
    {
        var privateKey = _config.PrivateKey.Replace("\\n", "\n", StringComparison.Ordinal);
        var credential = new ServiceAccountCredential(
            new ServiceAccountCredential.Initializer(_config.ClientEmail)
            {
                Scopes = Scopes
            }.FromPrivateKey(privateKey)
        );

        return new FormsService(
            new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "LearnMS"
            }
        );
    }
}
