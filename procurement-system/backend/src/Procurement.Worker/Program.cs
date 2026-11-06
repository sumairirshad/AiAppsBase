using Procurement.Application;
using Procurement.Infrastructure;
using Procurement.Infrastructure.Startup;
using Procurement.Worker.Jobs;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddProcurementApplication();
builder.Services.AddProcurementInfrastructure(builder.Configuration);

builder.Services.AddHostedService<OutboxDispatcherJob>();
builder.Services.AddHostedService<EscalationWatchJob>();
builder.Services.AddHostedService<RecurringGenerationJob>();
builder.Services.AddHostedService<SplitPurchaseDetectorJob>();
builder.Services.AddHostedService<MarketPriceLookupJob>();
builder.Services.AddHostedService<EmergencyWatchJob>();
builder.Services.AddHostedService<VendorScoreRecalcJob>();

var host = builder.Build();

await host.InitializeProcurementDatabaseAsync();

host.Run();
