namespace Procurement.Domain.Entities;

public class PolicyVersions : AuditableEntity
{
    public int VersionNo { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public short StatusId { get; set; }
    public long? ApprovedBy { get; set; }
    public Users? ApprovedByUser { get; set; }
    public string ChangeReason { get; set; } = default!;

    public ICollection<ApprovalBands> ApprovalBands { get; set; } = new List<ApprovalBands>();
    public ICollection<QuotationRules> QuotationRules { get; set; } = new List<QuotationRules>();
    public ICollection<PolicySettings> PolicySettings { get; set; } = new List<PolicySettings>();
}

public class ApprovalBands : AuditableEntity
{
    public long PolicyVersionId { get; set; }
    public PolicyVersions PolicyVersion { get; set; } = default!;
    public decimal MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }
    public int Sequence { get; set; }
    public long RoleId { get; set; }
    public Roles Role { get; set; } = default!;
}

public class QuotationRules : AuditableEntity
{
    public long PolicyVersionId { get; set; }
    public PolicyVersions PolicyVersion { get; set; } = default!;
    public long? SpendSubHeadId { get; set; }
    public SpendSubHeads? SpendSubHead { get; set; }
    public decimal? MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }
    public bool? StarVendor { get; set; }
    public bool? Emergency { get; set; }
    public byte RequiredQuotes { get; set; }
    public int Priority { get; set; }
    public string Description { get; set; } = default!;
}

public class PolicySettings : AuditableEntity
{
    public long PolicyVersionId { get; set; }
    public PolicyVersions PolicyVersion { get; set; } = default!;
    public string SettingKey { get; set; } = default!;
    public string ValueType { get; set; } = default!;
    public string Value { get; set; } = default!;
    public string Description { get; set; } = default!;
}
