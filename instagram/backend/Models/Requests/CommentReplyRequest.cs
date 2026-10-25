using System.ComponentModel.DataAnnotations;

namespace Instagram.Api.Models.Requests;

public class CommentReplyRequest
{
    [Required]
    public Guid AccountId { get; set; }

    [Required]
    [MaxLength(2200)]
    public required string Message { get; set; }
}

public class CommentVisibilityRequest
{
    [Required]
    public Guid AccountId { get; set; }

    [Required]
    public bool Hidden { get; set; }
}
