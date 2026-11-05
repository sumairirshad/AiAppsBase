namespace Procurement.Domain.Entities;

public abstract class Entity
{
    public long Id { get; set; }
}

public abstract class AuditableEntity : Entity
{
    public DateTime CreatedAt { get; set; }
    public long CreatedByUserId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public long? UpdatedByUserId { get; set; }
}

public abstract class LookupEntity
{
    public short Id { get; set; }
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public short SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public abstract class TerminalLookupEntity : LookupEntity
{
    public bool IsTerminal { get; set; }
}
