namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class PrComments : AuditableEntity
{
    public long Id { get; set; }
    public long PrId { get; set; }
    public short CommentTypeId { get; set; }
    public long AuthorUserId { get; set; }
    public string Body { get; set; } = string.Empty;
    public long? ParentCommentId { get; set; }
}
