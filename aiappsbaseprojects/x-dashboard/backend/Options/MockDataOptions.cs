namespace XDashboard.Api.Options;

public class MockDataOptions
{
    public const string SectionName = "MockData";

    public string SeedDirectory { get; set; } = "Seed";
    public int ScheduledPostsLookaheadDays { get; set; } = 14;
    public int DefaultEngagementHistoryDays { get; set; } = 14;
}
