using System.ComponentModel.DataAnnotations;

namespace Tisoro.LinkedIn.Api.Dtos;

public sealed class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";
}

public sealed class LoginResponse
{
    public string Token { get; set; } = "";
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "";
}
