using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Procurement.Application.Alerts;
using Procurement.Application.Common;
using Procurement.Application.Policy;
using Procurement.Application.Recurring;
using Procurement.Application.Requisitions;
using Procurement.Application.Sourcing;
using Procurement.Application.Tentative;
using Procurement.Application.Vendoring;
using Procurement.Application.Workflow;

namespace Procurement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddProcurementApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);

        services.AddScoped<LookupCache>();
        services.AddScoped<UserAccessService>();
        services.AddScoped<IPermissionChecker, PermissionChecker>();
        services.AddScoped<IApprovalBandResolver, ApprovalBandResolver>();
        services.AddScoped<IWorkflowEngine, WorkflowEngine>();
        services.AddScoped<IPolicySettingsReader, PolicySettingsReader>();
        services.AddScoped<VendorScoreService>();
        services.AddScoped<PrPriceGuidanceService>();
        services.AddScoped<QuotationRuleResolver>();
        services.AddScoped<NotificationService>();
        services.AddScoped<RecurringOccurrenceGenerator>();
        services.AddScoped<TentativeCostService>();

        return services;
    }
}
