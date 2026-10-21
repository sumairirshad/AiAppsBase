using System.ComponentModel.DataAnnotations;
using Tisoro.LinkedIn.Api.Models;

namespace Tisoro.LinkedIn.Api.Dtos;

public sealed class CaptionTemplateRequest
{
    [Required]
    public PostContentType ContentType { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = "";

    [Required]
    public string TemplateBody { get; set; } = "";

    public int? CharacterLimit { get; set; }
}

public sealed class CaptionTemplateResponse
{
    public Guid Id { get; set; }
    public PostContentType ContentType { get; set; }
    public string Title { get; set; } = "";
    public string TemplateBody { get; set; } = "";
    public int? CharacterLimit { get; set; }

    public static CaptionTemplateResponse FromEntity(CaptionTemplate t) => new()
    {
        Id = t.Id,
        ContentType = t.ContentType,
        Title = t.Title,
        TemplateBody = t.TemplateBody,
        CharacterLimit = t.CharacterLimit,
    };
}
