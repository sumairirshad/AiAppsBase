namespace GbpDashboard.Api.Models;

public class DayHours
{
    public bool IsClosed { get; set; }
    public string OpenTime { get; set; } = "09:00";
    public string CloseTime { get; set; } = "17:00";
}

public class BusinessHours
{
    public DayHours Monday { get; set; } = new();
    public DayHours Tuesday { get; set; } = new();
    public DayHours Wednesday { get; set; } = new();
    public DayHours Thursday { get; set; } = new();
    public DayHours Friday { get; set; } = new();
    public DayHours Saturday { get; set; } = new();
    public DayHours Sunday { get; set; } = new();
}
