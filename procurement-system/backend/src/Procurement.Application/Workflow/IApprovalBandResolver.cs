namespace Procurement.Application.Workflow;

// Expands ApprovalBands for one policy version into the ordered list of roles that must
// approve a PR of a given amount and (optionally) spend sub-head. This is the live
// implementation of BR-015/BR-018/DEC-017: the chain is computed from policy data, never
// hard-coded, and the PolicyVersionId passed in is the one snapshotted on the PR at submit
// time, so changing a band later never moves a running PR.
public interface IApprovalBandResolver
{
    Task<IReadOnlyList<ApprovalBandStep>> ResolveAsync(long policyVersionId, decimal amount, long? spendSubHeadId, CancellationToken ct = default);
}
