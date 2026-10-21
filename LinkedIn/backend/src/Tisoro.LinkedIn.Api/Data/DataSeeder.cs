using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Tisoro.LinkedIn.Api.Configuration;
using Tisoro.LinkedIn.Api.Models;
using Tisoro.LinkedIn.Api.Services;

namespace Tisoro.LinkedIn.Api.Data;

/// <summary>
/// Startup-only seeding: the first admin account (from InitialAdmin env vars,
/// so there is no open self-registration endpoint) and the caption templates
/// documented in the Tisoro LinkedIn content playbook. Both are idempotent —
/// safe to run on every startup.
/// </summary>
public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db, IOptions<InitialAdminOptions> adminOptions, IPasswordHasher passwordHasher, ILogger logger)
    {
        await db.Database.MigrateAsync();

        if (!await db.AdminUsers.AnyAsync())
        {
            var admin = adminOptions.Value;
            if (!string.IsNullOrWhiteSpace(admin.Email) && !string.IsNullOrWhiteSpace(admin.Password))
            {
                db.AdminUsers.Add(new AdminUser
                {
                    Id = Guid.NewGuid(),
                    Email = admin.Email.Trim().ToLowerInvariant(),
                    PasswordHash = passwordHasher.Hash(admin.Password),
                    FullName = string.IsNullOrWhiteSpace(admin.FullName) ? "Tisoro Admin" : admin.FullName,
                });
                await db.SaveChangesAsync();
                logger.LogInformation("Seeded initial admin user {Email}", admin.Email);
            }
            else
            {
                logger.LogWarning(
                    "No admin users exist and INITIALADMIN__EMAIL / INITIALADMIN__PASSWORD are not set — " +
                    "no one will be able to log in until an admin row is created.");
            }
        }

        if (!await db.CaptionTemplates.AnyAsync())
        {
            db.CaptionTemplates.AddRange(SeedTemplates());
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded caption templates");
        }
    }

    private static IEnumerable<CaptionTemplate> SeedTemplates()
    {
        yield return new CaptionTemplate
        {
            Id = Guid.NewGuid(),
            ContentType = PostContentType.MultiImage,
            Title = "TLEA / ceremony album post",
            CharacterLimit = 3000,
            TemplateBody =
                "HOOK — 1-2 short, evocative lines. No company names. A \"stop scrolling\" moment.\n\n" +
                "REVEAL — name the event, the occasion, the emotional stakes.\n\n" +
                "WHAT IT IS — 2-3 sentences on the event's purpose and values.\n\n" +
                "TRANSITION — one short line leading into the honorees.\n\n" +
                "WINNER BLOCKS (repeat per honoree):\n" +
                "[Company] — [Industry]\n" +
                "Represented by [Rep], whose [one specific, admirable, industry-tied achievement].\n\n" +
                "CONGRATULATIONS — a warm, punchy sign-off.\n\n" +
                "HASHTAGS — branded + discovery tags.",
        };

        yield return new CaptionTemplate
        {
            Id = Guid.NewGuid(),
            ContentType = PostContentType.Document,
            Title = "E-book / industry study / whitepaper carousel caption",
            CharacterLimit = 3000,
            TemplateBody =
                "HOOK — one line, no quotation marks. Names the tension or stakes the document addresses.\n\n" +
                "ORIENTATION — 2-3 sentences: full document title, format type (E-book / industry study / " +
                "whitepaper), scale or defining figure, author with locked title, what it covers.\n\n" +
                "Inside:\n" +
                "· [bullet — real section, finding, or figure]\n" +
                "· [bullet]\n" +
                "· [bullet]\n" +
                "· [bullet]\n\n" +
                "Swipe through to read the full [format type].\n\n" +
                "#hashtag1 #hashtag2 #hashtag3 #tisoro #hashtag5",
        };

        yield return new CaptionTemplate
        {
            Id = Guid.NewGuid(),
            ContentType = PostContentType.ArticleLink,
            Title = "Article / guide / case study announcement",
            CharacterLimit = 3000,
            TemplateBody =
                "[One or two sentence hook framing the tension the article resolves.]\n\n" +
                "[Author name, locked title] examines/explains [subject], and what changes when [the article's core argument].\n\n" +
                "#hashtag1 #hashtag2 #tisoro #tisoroglobal",
        };

        yield return new CaptionTemplate
        {
            Id = Guid.NewGuid(),
            ContentType = PostContentType.Text,
            Title = "Hiring post (feed)",
            CharacterLimit = 3000,
            TemplateBody =
                "WE ARE OFFERING THE BEST JOBS FOR {PROFESSION} IN 50 CITIES ACROSS THE GLOBE.\n\n" +
                "WE PROVIDE:\n\n" +
                "[benefit] · [benefit] · [benefit]\n\n" +
                "Read more about all the benefits in the end.\n\n" +
                "CITIES:\n[city list]\n\n" +
                "ALL THE BENEFITS WE PROVIDE:\n[benefit list]\n\n" +
                "To learn more, visit: [careers link]",
        };
    }
}
