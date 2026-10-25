namespace TikTok.Api.Models.Dtos;

public record ConnectAuthorizeResponse(string AuthorizationUrl);

public record ConnectedAccountDto(
    Guid Id,
    string Username,
    string DisplayName,
    string? AvatarUrl,
    string? BioDescription,
    bool IsVerified,
    long FollowerCount,
    long VideoCount,
    string GrantedScopes,
    bool IsActive,
    DateTimeOffset ConnectedAt,
    DateTimeOffset AccessTokenExpiresAt
);
