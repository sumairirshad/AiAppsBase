namespace Procurement.Application.Common.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string entityName, object key) : base($"{entityName} ({key}) was not found.") { }
}

public class AuthenticationException : Exception
{
    public AuthenticationException(string message) : base(message) { }
}

public class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException(string message = "You are not allowed to perform this action.") : base(message) { }
}

public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}

public class BusinessRuleException : Exception
{
    public BusinessRuleException(string message) : base(message) { }
}
