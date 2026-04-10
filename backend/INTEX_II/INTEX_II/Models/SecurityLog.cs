namespace INTEX_II.Models;

public class SecurityLog
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Level { get; set; } = "";      // "Info" | "Warning"
    public string EventType { get; set; } = "";  // e.g. "LOGIN_SUCCESS"
    public string? UserEmail { get; set; }
    public string? IpAddress { get; set; }
    public string? Details { get; set; }
}
