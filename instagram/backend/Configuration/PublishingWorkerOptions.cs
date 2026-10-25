namespace Instagram.Api.Configuration;

public class PublishingWorkerOptions
{
    public const string SectionName = "PublishingWorker";

    public int PollIntervalSeconds { get; set; } = 60;
    public int ContainerStatusPollIntervalSeconds { get; set; } = 5;
    public int ContainerStatusMaxAttempts { get; set; } = 20;
    public int MaxAttemptsPerJob { get; set; } = 3;
}
