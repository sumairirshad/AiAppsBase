using TikTok.Api.Entities;
using TikTok.Api.Models.Dtos;

namespace TikTok.Api.Services;

public interface IAccountConnectionService
{
    string BuildAuthorizationUrl(out string state);
    Task<ConnectedAccount> HandleCallbackAsync(string code, string state, CancellationToken ct);
    Task<IReadOnlyList<ConnectedAccountDto>> ListAccountsAsync(CancellationToken ct);
    Task DisconnectAsync(Guid accountId, CancellationToken ct);
    Task<string> GetValidAccessTokenAsync(ConnectedAccount account, CancellationToken ct);
}
