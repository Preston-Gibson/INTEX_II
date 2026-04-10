using INTEX_II.Data;
using INTEX_II.Models;

namespace INTEX_II.Services;

public class SecurityLogService
{
    private readonly AppDbContext _db;

    public SecurityLogService(AppDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(
        string level,
        string eventType,
        string? userEmail = null,
        string? ipAddress = null,
        string? details = null)
    {
        _db.SecurityLogs.Add(new SecurityLog
        {
            Timestamp = DateTime.UtcNow,
            Level     = level,
            EventType = eventType,
            UserEmail = userEmail,
            IpAddress = ipAddress,
            Details   = details,
        });
        await _db.SaveChangesAsync();
    }

    public Task InfoAsync(string eventType, string? userEmail = null, string? ip = null, string? details = null)
        => LogAsync("Info", eventType, userEmail, ip, details);

    public Task WarnAsync(string eventType, string? userEmail = null, string? ip = null, string? details = null)
        => LogAsync("Warning", eventType, userEmail, ip, details);
}
