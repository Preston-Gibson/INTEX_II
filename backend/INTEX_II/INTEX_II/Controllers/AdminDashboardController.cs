using INTEX_II.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin-dashboard")]
public class AdminDashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminDashboardController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/admin-dashboard/stats
    // Returns the four top-level metric cards for the command center
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var sevenDaysAgo = today.AddDays(-7);
        var thirtyDaysAgo = today.AddDays(-30);

        // Active residents (not yet discharged)
        var activeResidents = await _db.Residents
            .CountAsync(r => r.DateClosed == null);

        // New admissions in the past 7 days
        var activeResidentsWeekDelta = await _db.Residents
            .CountAsync(r => r.DateOfAdmission >= sevenDaysAgo);

        // Total donated cash in the last 30 days
        var recentDonationsTotal = await _db.Donations
            .Where(d => d.DonationDate != null
                     && d.DonationDate >= thirtyDaysAgo
                     && d.Amount != null)
            .SumAsync(d => d.Amount ?? 0m);

        // Top donor by total amount over the last 30 days (two-step to avoid GroupBy+navigation issues)
        var topDonorRaw = await _db.Donations
            .Where(d => d.DonationDate != null
                     && d.DonationDate >= thirtyDaysAgo
                     && d.Amount != null)
            .GroupBy(d => d.SupporterId)
            .Select(g => new { SupporterId = g.Key, Total = g.Sum(d => d.Amount ?? 0m) })
            .OrderByDescending(x => x.Total)
            .FirstOrDefaultAsync();

        var topDonorName = "N/A";
        if (topDonorRaw != null)
        {
            var supporter = await _db.Supporters.FindAsync(topDonorRaw.SupporterId);
            if (supporter != null)
            {
                topDonorName = !string.IsNullOrWhiteSpace(supporter.DisplayName)
                    ? supporter.DisplayName
                    : !string.IsNullOrWhiteSpace(supporter.OrganizationName)
                        ? supporter.OrganizationName
                        : $"{supporter.FirstName} {supporter.LastName}".Trim();
            }
        }

        // Pending case logs: active residents with no process recording in the last 30 days
        var residentsWithRecentRecording = _db.ProcessRecordings
            .Where(p => p.SessionDate >= thirtyDaysAgo)
            .Select(p => p.ResidentId)
            .Distinct();

        var pendingCaseLogs = await _db.Residents
            .Where(r => r.DateClosed == null
                     && !residentsWithRecentRecording.Contains(r.ResidentId))
            .CountAsync();

        // Urgent: active residents flagged at high risk
        var urgentCaseLogs = await _db.Residents
            .CountAsync(r => r.DateClosed == null
                          && r.CurrentRiskLevel.ToLower().Contains("high"));

        // Home visits scheduled for today
        var homeVisitsToday = await _db.HomeVisitations
            .CountAsync(v => v.VisitDate == today);

        // Next upcoming visit (today or later)
        var nextVisit = await _db.HomeVisitations
            .Where(v => v.VisitDate >= today)
            .OrderBy(v => v.VisitDate)
            .Select(v => new { v.VisitDate, v.LocationVisited })
            .FirstOrDefaultAsync();

        var nextVisitTime = nextVisit != null
            ? nextVisit.VisitDate.ToString("MMM d")
            : "None scheduled";
        var nextVisitLocation = nextVisit?.LocationVisited ?? "";

        return Ok(new
        {
            activeResidents,
            activeResidentsWeekDelta,
            recentDonationsTotal,
            topDonorName,
            pendingCaseLogs,
            urgentCaseLogs,
            homeVisitsToday,
            nextVisitTime,
            nextVisitLocation
        });
    }

    // GET /api/admin-dashboard/weekly-activity
    // Returns process recording counts grouped by day for the last 7 days (bar chart data)
    [HttpGet("weekly-activity")]
    public async Task<IActionResult> GetWeeklyActivity()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var sixDaysAgo = today.AddDays(-6);

        var rawCounts = await _db.ProcessRecordings
            .Where(p => p.SessionDate >= sixDaysAgo && p.SessionDate <= today)
            .GroupBy(p => p.SessionDate)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync();

        var countsByDate = rawCounts.ToDictionary(x => x.Date, x => x.Count);

        var days = Enumerable.Range(0, 7)
            .Select(offset =>
            {
                var date = sixDaysAgo.AddDays(offset);
                var dayName = date.DayOfWeek.ToString();
                return new
                {
                    day = dayName,
                    shortDay = dayName[..3],
                    value = countsByDate.TryGetValue(date, out var count) ? count : 0
                };
            })
            .ToList();

        return Ok(days);
    }

    // GET /api/admin-dashboard/upcoming-visits
    // Returns the next 8 scheduled home visits for the visits list
    [HttpGet("upcoming-visits")]
    public async Task<IActionResult> GetUpcomingVisits()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var visits = await _db.HomeVisitations
            .Where(v => v.VisitDate >= today)
            .OrderBy(v => v.VisitDate)
            .Take(8)
            .Include(v => v.Resident)
            .Select(v => new
            {
                visitationId    = v.VisitationId,
                residentCaseNo  = v.Resident != null ? v.Resident.CaseControlNo : "Unknown",
                visitDate       = v.VisitDate.ToString("yyyy-MM-dd"),
                visitType       = v.VisitType,
                locationVisited = v.LocationVisited,
                socialWorker    = v.SocialWorker,
                status          = !string.IsNullOrEmpty(v.SocialWorker) ? "assigned" : "pending"
            })
            .ToListAsync();

        return Ok(visits);
    }

    // GET /api/admin-dashboard/reintegration-rate
    // Returns the OKR metric: percentage of residents that successfully reintegrated
    [HttpGet("reintegration-rate")]
    public async Task<IActionResult> GetReintegrationRate()
    {
        var total = await _db.Residents.CountAsync();
        var successful = await _db.Residents
            .CountAsync(r => r.ReintegrationStatus != null &&
                             r.ReintegrationStatus.ToLower().Contains("complet"));

        var rate = total > 0 ? Math.Round((double)successful / total * 100, 1) : 0;

        return Ok(new { total, successful, rate });
    }

    // GET /api/admin-dashboard/recent-activity
    // Returns a merged, time-sorted feed of recent intakes, donations, visits, and incidents
    [HttpGet("recent-activity")]
    public async Task<IActionResult> GetRecentActivity()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var sevenDaysAgo = today.AddDays(-7);

        // Recent resident intakes
        var recentIntakes = await _db.Residents
            .Where(r => r.DateOfAdmission >= sevenDaysAgo)
            .OrderByDescending(r => r.DateOfAdmission)
            .Take(4)
            .Select(r => new { r.CaseControlNo, r.AssignedSocialWorker, r.DateOfAdmission })
            .ToListAsync();

        // Recent cash donations
        var recentDonations = await _db.Donations
            .Where(d => d.DonationDate != null
                     && d.DonationDate >= sevenDaysAgo
                     && d.Amount != null)
            .Include(d => d.Supporter)
            .OrderByDescending(d => d.DonationDate)
            .Take(4)
            .Select(d => new
            {
                Amount    = d.Amount ?? 0m,
                DonorName = d.Supporter != null
                    ? (!string.IsNullOrEmpty(d.Supporter.DisplayName)
                        ? d.Supporter.DisplayName
                        : d.Supporter.OrganizationName)
                    : "Anonymous",
                Date = d.DonationDate!.Value
            })
            .ToListAsync();

        // Recently completed home visits
        var recentVisits = await _db.HomeVisitations
            .Where(v => v.VisitDate >= sevenDaysAgo
                     && v.VisitDate <= today
                     && !string.IsNullOrEmpty(v.VisitOutcome))
            .OrderByDescending(v => v.VisitDate)
            .Take(4)
            .Select(v => new { v.VisitType, v.LocationVisited, v.SocialWorker, v.VisitDate })
            .ToListAsync();

        // Unresolved incidents this week (displayed as alerts)
        var alerts = await _db.IncidentReports
            .Where(i => i.IncidentDate >= sevenDaysAgo && !i.Resolved)
            .OrderByDescending(i => i.IncidentDate)
            .Take(3)
            .Select(i => new { i.IncidentType, i.Severity, i.ReportedBy, i.IncidentDate })
            .ToListAsync();

        // Merge into a single list sorted by date descending, capped at 8 items
        var merged = new List<(DateOnly Date, string Type, string Description)>();

        foreach (var r in recentIntakes)
            merged.Add((r.DateOfAdmission, "case",
                $"<span class=\"font-bold\">{Esc(r.AssignedSocialWorker)}</span> logged new intake for Case #{Esc(r.CaseControlNo)}."));

        foreach (var d in recentDonations)
            merged.Add((d.Date, "donation",
                $"<span class=\"font-bold\">Donation Log:</span> ${d.Amount:N0} received from {Esc(d.DonorName)}."));

        foreach (var v in recentVisits)
            merged.Add((v.VisitDate, "visit",
                $"<span class=\"font-bold\">Visit Completed:</span> {Esc(v.VisitType)} at {Esc(v.LocationVisited)} by {Esc(v.SocialWorker)}."));

        foreach (var a in alerts)
            merged.Add((a.IncidentDate, "alert",
                $"<span class=\"font-bold\">Incident ({Esc(a.Severity)}):</span> {Esc(a.IncidentType)} reported by {Esc(a.ReportedBy)}."));

        var result = merged
            .OrderByDescending(x => x.Date)
            .Take(8)
            .Select((x, idx) => new
            {
                id          = idx + 1,
                type        = x.Type,
                description = x.Description,
                timeAgo     = DaysAgo(x.Date, today)
            })
            .ToList();

        return Ok(result);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static string DaysAgo(DateOnly date, DateOnly today)
    {
        var days = today.DayNumber - date.DayNumber;
        return days switch
        {
            0 => "Today",
            1 => "Yesterday",
            _ => $"{days} days ago"
        };
    }

    /// <summary>Escapes user-controlled strings before embedding in HTML descriptions.</summary>
    private static string Esc(string? input) =>
        string.IsNullOrEmpty(input) ? "" : input
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;");
}
