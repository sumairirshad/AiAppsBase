namespace Instagram.Api.Models.Dtos;

public record AccountDto(
    Guid Id,
    string PlatformUserId,
    string Username,
    string? DisplayName,
    string? ProfilePictureUrl,
    string? AccountType,
    string? Biography,
    string? Website,
    int? FollowersCount,
    int? MediaCount,
    DateTimeOffset TokenExpiresAt,
    DateTimeOffset ConnectedAt,
    bool IsActive);
