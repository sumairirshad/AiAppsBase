using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Identity.Auth;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult>;

public record LoginResult(string Token, DateTime ExpiresAtUtc, long UserId, string DisplayName, IReadOnlyList<RoleAssignmentDto> Roles);
public record RoleAssignmentDto(string RoleCode, long? DepartmentId, string? DepartmentCode);

public class LoginValidator : AbstractValidator<LoginCommand>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenGenerator _jwt;
    private readonly UserAccessService _access;

    public LoginHandler(IApplicationDbContext db, IPasswordHasher hasher, IJwtTokenGenerator jwt, UserAccessService access)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
        _access = access;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive, ct);
        if (user is null || user.PasswordHash is null || !_hasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var (token, expires) = _jwt.Generate(user.Id);
        var assignments = await _access.GetAssignmentsAsync(user.Id, ct);
        var departments = await _db.Departments.ToDictionaryAsync(d => d.Id, d => d.Code, ct);

        var roles = assignments.Select(a => new RoleAssignmentDto(
            a.RoleCode, a.DepartmentId, a.DepartmentId.HasValue ? departments.GetValueOrDefault(a.DepartmentId.Value) : null)).ToList();

        return new LoginResult(token, expires, user.Id, user.DisplayName, roles);
    }
}
