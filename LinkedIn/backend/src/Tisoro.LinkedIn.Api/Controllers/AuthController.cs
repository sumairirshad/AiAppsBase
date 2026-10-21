using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tisoro.LinkedIn.Api.Data;
using Tisoro.LinkedIn.Api.Dtos;
using Tisoro.LinkedIn.Api.Services;

namespace Tisoro.LinkedIn.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext db, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService, ILogger<AuthController> logger)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.AdminUsers.FirstOrDefaultAsync(u => u.Email == email);

        // Always run the hash comparison, even for a nonexistent user, against a
        // syntactically valid dummy hash — otherwise a missing-email request
        // returns faster than a wrong-password one, letting an attacker enumerate
        // valid emails by response timing.
        var hashToVerify = user?.PasswordHash ?? "100000.AAAAAAAAAAAAAAAAAAAAAA==.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
        var passwordOk = _passwordHasher.Verify(request.Password, hashToVerify);

        if (user is null || !passwordOk)
        {
            _logger.LogWarning("Failed login attempt for {Email}", email);
            return Unauthorized(new { error = "Invalid email or password." });
        }

        var token = _jwtTokenService.IssueToken(user);
        return Ok(new LoginResponse { Token = token, Email = user.Email, FullName = user.FullName });
    }
}
