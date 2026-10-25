namespace Instagram.Api.Entities;

public class InsightsSnapshot
{
    public Guid Id { get; set; }
    public Guid ConnectedAccountId { get; set; }
    public ConnectedAccount? ConnectedAccount { get; set; }

    public Guid? PublishingJobId { get; set; }

    public required string MetricName { get; set; }
    public long MetricValue { get; set; }
    public DateTimeOffset CapturedAt { get; set; }
}
