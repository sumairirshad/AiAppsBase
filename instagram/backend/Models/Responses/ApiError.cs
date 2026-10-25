namespace Instagram.Api.Models.Responses;

public record ApiError(string Message, IReadOnlyDictionary<string, string[]>? ValidationErrors = null);
