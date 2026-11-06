using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Infrastructure.Services;

// Real SMTP send when Smtp:Host is configured; otherwise logs instead of throwing, so a dev
// environment with no mail server still runs the full outbox loop end to end.
public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string body, CancellationToken ct = default)
    {
        var host = _configuration["Smtp:Host"];
        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogInformation("Email (no SMTP configured) -> {To}: {Subject}\n{Body}", toEmail, subject, body);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(_configuration["Smtp:From"] ?? "procurement@localhost"));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("plain") { Text = body };

        using var client = new SmtpClient();
        await client.ConnectAsync(host, int.Parse(_configuration["Smtp:Port"] ?? "587"), SecureSocketOptions.StartTlsWhenAvailable, ct);
        var user = _configuration["Smtp:User"];
        var password = _configuration["Smtp:Password"];
        if (!string.IsNullOrWhiteSpace(user) && password is not null) await client.AuthenticateAsync(user, password, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }
}

// WhatsApp (PO dispatch) has no free/standard provider to default to, so this always logs -
// swap for a real provider (e.g. Twilio, Meta Cloud API) behind the same interface.
public class LoggingWhatsAppSender : IWhatsAppSender
{
    private readonly ILogger<LoggingWhatsAppSender> _logger;

    public LoggingWhatsAppSender(ILogger<LoggingWhatsAppSender> logger) => _logger = logger;

    public Task SendAsync(string toPhone, string message, CancellationToken ct = default)
    {
        _logger.LogInformation("WhatsApp (not configured) -> {To}: {Message}", toPhone, message);
        return Task.CompletedTask;
    }
}
