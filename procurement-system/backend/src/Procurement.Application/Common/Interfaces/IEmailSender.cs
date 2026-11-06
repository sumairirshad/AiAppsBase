namespace Procurement.Application.Common.Interfaces;

public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string body, CancellationToken ct = default);
}

public interface IWhatsAppSender
{
    Task SendAsync(string toPhone, string message, CancellationToken ct = default);
}
