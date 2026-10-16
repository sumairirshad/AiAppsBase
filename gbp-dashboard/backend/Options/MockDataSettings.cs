namespace GbpDashboard.Api.Options;

public class MockDataSettings
{
    public const string SectionName = "MockData";

    public bool UseMockData { get; set; } = true;
    public int SimulatedLatencyMs { get; set; }
}
