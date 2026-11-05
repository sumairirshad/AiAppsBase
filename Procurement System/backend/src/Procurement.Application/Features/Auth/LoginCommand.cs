using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Features.Auth;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private readonly IProcurementDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public LoginCommandHandler(IProcurementDbContext db, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user == null || !user.IsActive || user.PasswordHash == null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new AuthenticationException("Invalid email or password.");
        }

        var token = _jwtTokenService.GenerateToken(user.Id);
        var userDto = await UserDtoBuilder.BuildAsync(_db, user, cancellationToken);
        return new LoginResult(token, userDto);
    }
}
