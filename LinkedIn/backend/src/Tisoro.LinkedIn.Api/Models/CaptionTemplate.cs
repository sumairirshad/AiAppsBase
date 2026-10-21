namespace Tisoro.LinkedIn.Api.Models;

/// <summary>
/// A reusable caption scaffold for a content type, seeded from the structures
/// documented in the Tisoro LinkedIn content playbook (e.g. the TLEA album-post
/// structure, the e-book/whitepaper caption structure). This stores the
/// documented template text only — it is not an AI generator.
/// </summary>
public sealed class CaptionTemplate
{
    public Guid Id { get; set; }
    public PostContentType ContentType { get; set; }
    public string Title { get; set; } = "";
    public string TemplateBody { get; set; } = "";
    public int? CharacterLimit { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
