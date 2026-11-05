using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Procurement.Application.Workflow;

namespace Procurement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddProcurementApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddScoped<IWorkflowEngine, WorkflowEngine>();
        return services;
    }
}
