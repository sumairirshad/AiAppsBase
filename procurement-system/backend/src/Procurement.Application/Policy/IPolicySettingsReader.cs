namespace Procurement.Application.Policy;

// Every configurable threshold in the spec (quote count threshold, star-vendor score, escalation
// days, tentative tiers, over-market warning, survey staleness...) is read through here, keyed
// by the PolicyVersionId snapshotted on the record being evaluated - never hard-coded, and a
// policy edit never moves a value already in use by a running PR (DEC-017 / "Thresholds are
// never hard-coded" from PROJECT.md).
public interface IPolicySettingsReader
{
    Task<decimal> GetDecimalAsync(long policyVersionId, string settingKey, decimal fallback, CancellationToken ct = default);
    Task<bool> GetBoolAsync(long policyVersionId, string settingKey, bool fallback, CancellationToken ct = default);
    Task<int> GetIntAsync(long policyVersionId, string settingKey, int fallback, CancellationToken ct = default);
}
