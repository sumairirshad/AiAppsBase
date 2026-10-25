using Instagram.Api.Models.Dtos;

namespace Instagram.Api.Services;

public interface IAccountService
{
    Task<IReadOnlyList<AccountDto>> GetAccountsAsync(CancellationToken ct);
    Task<AccountDto?> GetAccountAsync(Guid id, CancellationToken ct);
    Task<AccountDto> CompleteConnectionAsync(string authorizationCode, string codeVerifier, CancellationToken ct);
    Task DisconnectAsync(Guid id, CancellationToken ct);
    Task<string> GetDecryptedAccessTokenAsync(Guid accountId, CancellationToken ct);
}
