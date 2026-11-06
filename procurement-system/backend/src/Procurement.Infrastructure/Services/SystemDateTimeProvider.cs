using Procurement.Application.Common.Interfaces;

namespace Procurement.Infrastructure.Services;

public class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}
