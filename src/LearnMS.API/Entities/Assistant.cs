namespace LearnMS.API.Entities;

public class Assistant : User
{
    public int Apples { get; set; }
    public int SessionsAttended { get; set; }
    public string Code { get; set; } = string.Empty;

    public static Assistant Register(Account account, string? code = null)
    {
        var id = Guid.NewGuid();
        account.Id = id;
        return new Assistant
        {
            Id = id,
            Code = string.IsNullOrWhiteSpace(code) ? GenerateCode() : code.Trim(),
            Accounts = new List<Account> { account }
        };
    }

    public static string GenerateCode()
    {
        return Random.Shared.Next(200000, 999999).ToString();
    }

    public HashSet<Permission> Permissions { get; set; } = new();

    private Assistant() { }
}
