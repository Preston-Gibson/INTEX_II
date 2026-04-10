using INTEX_II.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/security-logs")]
public class SecurityLogsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SecurityLogsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/security-logs?level=Warning&search=email@example.com&page=1&pageSize=50
    [HttpGet]
    public async Task<IActionResult> GetLogs(
        [FromQuery] string? level,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _db.SecurityLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(level))
            query = query.Where(l => l.Level == level);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(l =>
                (l.UserEmail != null && l.UserEmail.Contains(search)) ||
                (l.IpAddress != null && l.IpAddress.Contains(search)) ||
                (l.Details   != null && l.Details.Contains(search))   ||
                l.EventType.Contains(search));

        var total = await query.CountAsync();

        var logs = await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new
            {
                l.Id,
                l.Timestamp,
                l.Level,
                l.EventType,
                l.UserEmail,
                l.IpAddress,
                l.Details,
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, logs });
    }
}
