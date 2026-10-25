using System.ComponentModel.DataAnnotations;

namespace Instagram.Api.Models.Requests;

public class CompleteConnectionRequest
{
    [Required]
    public required string Code { get; set; }

    [Required]
    public required string State { get; set; }
}
