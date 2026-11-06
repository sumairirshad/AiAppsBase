using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Recurring;

// BR-046: creates the period's PR from an approved plan - UNIQUE(PlanId, OccurrenceKey) on
// RecurringOccurrences makes this idempotent, so calling it twice for the same plan/period
// (e.g. the Worker's scheduled job re-running) never creates a second PR. Called by the
// Worker (RecurringOccurrenceGenerator job) on each plan's GenerationDay; exposed here as a
// service so it is unit-testable independent of the BackgroundService.
public class RecurringOccurrenceGenerator
{
    private readonly IApplicationDbContext _db;
    private readonly LookupCache _lookups;
    private readonly IDocumentNumberGenerator _numbers;
    private readonly IWorkflowEngine _workflow;

    public RecurringOccurrenceGenerator(IApplicationDbContext db, LookupCache lookups, IDocumentNumberGenerator numbers, IWorkflowEngine workflow)
    {
        _db = db;
        _lookups = lookups;
        _numbers = numbers;
        _workflow = workflow;
    }

    public async Task<long?> GenerateForPeriodAsync(long planId, DateOnly periodStart, CancellationToken ct = default)
    {
        var plan = await _db.Set<RecurringPlans>().FirstOrDefaultAsync(p => p.Id == planId, ct)
            ?? throw new InvalidOperationException("Recurring plan not found.");
        var occurrenceKey = $"{periodStart.Year:D4}-{periodStart.Month:D2}";

        var existing = await _db.Set<RecurringOccurrences>().FirstOrDefaultAsync(o => o.PlanId == planId && o.OccurrenceKey == occurrenceKey, ct);
        if (existing is not null) return existing.GeneratedPrId;

        var occurrence = new RecurringOccurrences
        {
            PlanId = planId,
            PlanVersionNo = plan.CurrentVersionNo,
            OccurrenceKey = occurrenceKey,
            ScheduledFor = periodStart,
            OccurrenceStatusId = await _lookups.IdAsync<OccurrenceStatuses, short>("Scheduled", ct),
        };
        _db.Set<RecurringOccurrences>().Add(occurrence);
        await _db.SaveChangesAsync(ct);

        try
        {
            var subHead = await _db.SpendSubHeads.FirstAsync(s => s.Id == plan.SpendSubHeadId, ct);
            var planType = await _db.Set<RecurringPlanTypes>().FirstAsync(t => t.Id == plan.RecurringPlanTypeId, ct);
            var isItemsPlan = planType.Code == "Items";

            var draftStatus = await _lookups.IdAsync<PrStatuses, short>(isItemsPlan ? "Draft" : "AwaitingBill", ct);
            var costTypeId = await _lookups.IdAsync<CostTypes, short>("Final", ct);
            var policyVersionId = await _db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);

            var pr = new PurchaseRequisitions
            {
                PrNumber = await _numbers.NextAsync(DocumentSequence.Pr, ct),
                RequesterId = plan.OwnerUserId,
                DepartmentId = plan.DepartmentId,
                LocationId = plan.LocationId,
                SpendSubHeadId = plan.SpendSubHeadId,
                CostTypeId = costTypeId,
                Title = $"{subHead.Name} - {occurrenceKey}",
                EstimatedAmount = plan.FixedAmount
                    ?? await _db.Set<RecurringPlanLines>().Where(l => l.PlanId == planId).Select(l => l.Qty * (l.AgreedPrice ?? 0)).SumAsync(ct),
                PrStatusId = draftStatus,
                PolicyVersionId = policyVersionId,
                RecurringOccurrenceId = occurrence.Id,
                CreatedBy = plan.OwnerUserId,
            };
            _db.PurchaseRequisitions.Add(pr);
            await _db.SaveChangesAsync(ct);

            if (isItemsPlan)
            {
                var lineNo = 1;
                foreach (var planLine in await _db.Set<RecurringPlanLines>().Where(l => l.PlanId == planId).ToListAsync(ct))
                {
                    _db.PrLines.Add(new PrLines
                    {
                        PrId = pr.Id,
                        LineNo = lineNo++,
                        ItemId = planLine.ItemId,
                        Qty = planLine.Qty,
                        UnitId = planLine.UnitId,
                        EstUnitPrice = planLine.AgreedPrice ?? 0,
                        SuggestedVendorId = plan.VendorId,
                        // The vendor is pre-agreed on the plan itself - PROCUREMENT_VERIFY_QUOTE
                        // confirms the price with one quotation, it doesn't run a competitive
                        // award, so the line is already "awarded" for PO creation purposes.
                        AwardedVendorId = plan.VendorId,
                        LocationId = plan.LocationId,
                        CreatedBy = plan.OwnerUserId,
                    });
                }
                await _db.SaveChangesAsync(ct);
            }

            // One spend sub-head, two workflows (WF_CYCLIC_BILL / WF_CYCLIC_ITEMS) - see
            // Infrastructure/Persistence/Seed/SpendTaxonomySeeder.cs for why this override
            // exists instead of SpendSubHeads.WorkflowDefinitionId alone.
            var definitionCode = isItemsPlan ? "WF_CYCLIC_ITEMS" : "WF_CYCLIC_BILL";
            var systemRoleId = await _lookups.IdAsync<Roles, long>("SYSTEM", ct);
            var start = await _workflow.StartAsync(new StartWorkflowRequest(
                definitionCode, pr.Id, plan.OwnerUserId, systemRoleId, policyVersionId,
                pr.EstimatedAmount, plan.SpendSubHeadId, plan.DepartmentId, plan.OwnerUserId), ct);

            pr.WorkflowInstanceId = start.InstanceId;
            if (start.CurrentStageCode is not null)
            {
                var definitionId = await _db.WorkflowDefinitions.Where(d => d.Code == definitionCode).Select(d => d.Id).FirstAsync(ct);
                pr.PrStatusId = (await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == start.CurrentStageCode, ct))?.PrStatusId ?? draftStatus;
            }
            await _db.SaveChangesAsync(ct);

            occurrence.OccurrenceStatusId = await _lookups.IdAsync<OccurrenceStatuses, short>("Generated", ct);
            occurrence.GeneratedPrId = pr.Id;
            occurrence.GeneratedAt = DateTime.UtcNow;

            plan.NextRunDate = periodStart.AddMonths(FrequencyMonths(await _db.Set<RecurringFrequencies>().FirstAsync(f => f.Id == plan.FrequencyId, ct)));
            await _db.SaveChangesAsync(ct);

            return pr.Id;
        }
        catch (Exception ex)
        {
            occurrence.OccurrenceStatusId = await _lookups.IdAsync<OccurrenceStatuses, short>("Failed", ct);
            occurrence.Error = ex.Message;
            await _db.SaveChangesAsync(ct);
            throw;
        }
    }

    private static int FrequencyMonths(RecurringFrequencies frequency) => frequency.Code switch
    {
        "Monthly" => 1,
        "Quarterly" => 3,
        "HalfYearly" => 6,
        "Yearly" => 12,
        _ => 1,
    };
}
