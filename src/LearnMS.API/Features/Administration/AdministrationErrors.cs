using LearnMS.API.Common;

namespace LearnMS.API.Features.Administration;

public static class AdministrationErrors
{
    public static readonly ApiError AssistantNotFound = new("administration/assistant-not-found", "Assistant not found", StatusCodes.Status404NotFound);
    public static readonly ApiError EmailAlreadyRegistered = new("administration/email-already-registered", "Email already registered", StatusCodes.Status409Conflict);
    public static readonly ApiError CodeAlreadyExists = new("administration/code-already-exists", "Assistant code already exists", StatusCodes.Status409Conflict);
}
