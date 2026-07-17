using LearnMS.API.Features.Parent.Contracts;

namespace LearnMS.API.Features.Parent;

public interface IParentService
{
    Task<ParentLoginResult> LoginAsync(ParentLoginCommand command);
    Task<ParentProgressResult> GetProgressAsync(string token);
}
