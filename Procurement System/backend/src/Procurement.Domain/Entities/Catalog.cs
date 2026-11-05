namespace Procurement.Domain.Entities;

public class SpendHeads : Entity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string ApprovalMode { get; set; } = default!;

    public ICollection<SpendSubHeads> SubHeads { get; set; } = new List<SpendSubHeads>();
}

public class SpendSubHeads : Entity
{
    public long SpendHeadId { get; set; }
    public SpendHeads SpendHead { get; set; } = default!;
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public short ProcurementModeId { get; set; }
    public bool AllowsTentative { get; set; }
    public long WorkflowDefinitionId { get; set; }
    public WorkflowDefinitions WorkflowDefinition { get; set; } = default!;
}

public class Units : Entity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public byte Precision { get; set; }
}

public class Categories : AuditableEntity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public long? ParentId { get; set; }
    public Categories? Parent { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Categories> Children { get; set; } = new List<Categories>();
    public ICollection<Items> Items { get; set; } = new List<Items>();
}

public class Items : AuditableEntity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public long CategoryId { get; set; }
    public Categories Category { get; set; } = default!;
    public long UnitId { get; set; }
    public Units Unit { get; set; } = default!;
    public bool IsActive { get; set; } = true;
}

public class ItemRequests : AuditableEntity
{
    public string RequestType { get; set; } = default!;
    public string ProposedName { get; set; } = default!;
    public long? CategoryId { get; set; }
    public Categories? Category { get; set; }
    public long RequestedBy { get; set; }
    public Users Requester { get; set; } = default!;
    public short StatusId { get; set; }
    public long? DecisionBy { get; set; }
    public Users? DecisionByUser { get; set; }
    public string? DecisionReason { get; set; }
    public long? CreatedItemId { get; set; }
    public Items? CreatedItem { get; set; }
}

public class Projects : AuditableEntity
{
    public string ProjectCode { get; set; } = default!;
    public string Name { get; set; } = default!;
    public long OwnerDepartmentId { get; set; }
    public Departments OwnerDepartment { get; set; } = default!;
    public long? ManagerUserId { get; set; }
    public Users? ManagerUser { get; set; }
    public bool ContractProvided { get; set; }
    public bool IsActive { get; set; } = true;
}

public class DepartmentCategories : Entity
{
    public long DepartmentId { get; set; }
    public Departments Department { get; set; } = default!;
    public long CategoryId { get; set; }
    public Categories Category { get; set; } = default!;
}
