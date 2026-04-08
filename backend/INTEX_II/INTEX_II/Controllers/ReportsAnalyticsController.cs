using INTEX_II.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/reports")]
public class ReportsAnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportsAnalyticsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/reports/donation-trends?year=2024
    [HttpGet("donation-trends")]
    public async Task<IActionResult> GetDonationTrends([FromQuery] int year = 0)
    {
        if (year == 0) year = DateTime.UtcNow.Year;

        var donations = await _db.Donations
            .Where(d => d.DonationDate.HasValue && d.DonationDate.Value.Year == year)
            .ToListAsync();

        var byMonth = donations
            .GroupBy(d => d.DonationDate!.Value.Month)
            .Select(g => new
            {
                month = g.Key,
                amount = g.Sum(d => d.EstimatedValue)
            })
            .ToDictionary(x => x.month, x => x.amount);

        var result = Enumerable.Range(1, 12).Select(m => new
        {
            month = m,
            amount = byMonth.TryGetValue(m, out var val) ? val : 0m
        });

        return Ok(result);
    }

    // GET /api/reports/pillars?year=2024
    [HttpGet("pillars")]
    public async Task<IActionResult> GetPillars([FromQuery] int year = 0)
    {
        if (year == 0) year = DateTime.UtcNow.Year;

        // --- Caring ---
        var activeResidents = await _db.Residents
            .CountAsync(r => r.DateClosed == null || r.DateClosed.Value.Year >= year);

        var healthVisits = await _db.HealthWellbeingRecords
            .CountAsync(h => h.RecordDate.Year == year);

        var mentalHealthSessions = await _db.HealthWellbeingRecords
            .CountAsync(h => h.RecordDate.Year == year && h.PsychologicalCheckupDone);

        var dentalCheckups = await _db.HealthWellbeingRecords
            .CountAsync(h => h.RecordDate.Year == year && h.DentalCheckupDone);

        // --- Healing ---
        var reintegrationsCompleted = await _db.Residents
            .CountAsync(r => r.ReintegrationStatus != null &&
                             r.ReintegrationStatus.ToLower().Contains("complet") &&
                             r.DateClosed.HasValue && r.DateClosed.Value.Year == year);

        var activeInterventionPlans = await _db.InterventionPlans
            .CountAsync(p => p.Status.ToLower().Contains("active") ||
                             p.Status.ToLower().Contains("progress"));

        var totalIncidents = await _db.IncidentReports
            .CountAsync(i => i.IncidentDate.Year == year);

        var resolvedIncidents = await _db.IncidentReports
            .CountAsync(i => i.IncidentDate.Year == year && i.Resolved);

        var incidentResponseRate = totalIncidents > 0
            ? Math.Round((double)resolvedIncidents / totalIncidents * 100, 1)
            : 100.0;

        var avgLengthOfStayMonths = await _db.Residents
            .Where(r => r.DateClosed.HasValue && r.DateClosed.Value.Year == year)
            .Select(r => (double?)
                ((r.DateClosed!.Value.Year - r.DateOfAdmission.Year) * 12 +
                 (r.DateClosed.Value.Month - r.DateOfAdmission.Month)))
            .AverageAsync() ?? 0;

        // --- Teaching ---
        var enrolledStudents = await _db.EducationRecords
            .Where(e => e.RecordDate.Year == year)
            .Select(e => e.ResidentId)
            .Distinct()
            .CountAsync();

        var avgAttendanceRate = await _db.EducationRecords
            .Where(e => e.RecordDate.Year == year)
            .AverageAsync(e => (double?)e.AttendanceRate) ?? 0;

        var avgProgressPercent = await _db.EducationRecords
            .Where(e => e.RecordDate.Year == year)
            .AverageAsync(e => (double?)e.ProgressPercent) ?? 0;

        var completedCourses = await _db.EducationRecords
            .CountAsync(e => e.RecordDate.Year == year &&
                             e.CompletionStatus.ToLower().Contains("complet"));

        return Ok(new
        {
            caring = new
            {
                activeResidents,
                healthVisits,
                mentalHealthSessions,
                dentalCheckups
            },
            healing = new
            {
                reintegrationsCompleted,
                activeInterventionPlans,
                incidentResponseRate,
                avgLengthOfStayMonths = Math.Round(avgLengthOfStayMonths, 1)
            },
            teaching = new
            {
                enrolledStudents,
                avgAttendanceRate = Math.Round(avgAttendanceRate, 1),
                avgProgressPercent = Math.Round(avgProgressPercent, 1),
                completedCourses
            }
        });
    }

    // GET /api/reports/outcome-metrics?year=2024
    [HttpGet("outcome-metrics")]
    public async Task<IActionResult> GetOutcomeMetrics([FromQuery] int year = 0)
    {
        if (year == 0) year = DateTime.UtcNow.Year;

        var avgEducationProgress = await _db.EducationRecords
            .Where(e => e.RecordDate.Year == year)
            .AverageAsync(e => (double?)e.ProgressPercent) ?? 0;

        var avgHealthScore = await _db.HealthWellbeingRecords
            .Where(h => h.RecordDate.Year == year)
            .AverageAsync(h => (double?)h.GeneralHealthScore) ?? 0;

        var totalClosed = await _db.Residents
            .CountAsync(r => r.DateClosed.HasValue && r.DateClosed.Value.Year == year);

        var reintegrated = await _db.Residents
            .CountAsync(r => r.DateClosed.HasValue && r.DateClosed.Value.Year == year &&
                             r.ReintegrationStatus != null &&
                             r.ReintegrationStatus.ToLower().Contains("complet"));

        var reintegrationRate = totalClosed > 0
            ? Math.Round((double)reintegrated / totalClosed * 100, 1)
            : 0;

        var avgAttendance = await _db.EducationRecords
            .Where(e => e.RecordDate.Year == year)
            .AverageAsync(e => (double?)e.AttendanceRate) ?? 0;

        return Ok(new
        {
            educationProgress = Math.Round(avgEducationProgress, 1),
            healthScore = Math.Round(avgHealthScore, 1),
            reintegrationRate,
            attendanceRate = Math.Round(avgAttendance, 1)
        });
    }

    // GET /api/reports/safehouses?year=2024
    [HttpGet("safehouses")]
    public async Task<IActionResult> GetSafehouses([FromQuery] int year = 0)
    {
        if (year == 0) year = DateTime.UtcNow.Year;

        var safehouses = await _db.Safehouses
            .Include(s => s.Residents)
                .ThenInclude(r => r.HealthRecords)
            .Include(s => s.Residents)
                .ThenInclude(r => r.EducationRecords)
            .ToListAsync();

        var result = safehouses.Select(s =>
        {
            var activeResidents = s.Residents
                .Count(r => r.DateClosed == null || r.DateClosed.Value.Year >= year);

            var reintegrated = s.Residents
                .Count(r => r.DateClosed.HasValue && r.DateClosed.Value.Year == year &&
                            r.ReintegrationStatus != null &&
                            r.ReintegrationStatus.ToLower().Contains("complet"));

            var educationRecordCount = s.Residents
                .SelectMany(r => r.EducationRecords)
                .Count(e => e.RecordDate.Year == year);

            var healthVisits = s.Residents
                .SelectMany(r => r.HealthRecords)
                .Count(h => h.RecordDate.Year == year);

            var capacity = s.CapacityGirls;
            var utilization = capacity > 0
                ? Math.Round((double)activeResidents / capacity * 100, 1)
                : 0;

            return new
            {
                s.SafehouseId,
                s.Name,
                s.Country,
                residents = activeResidents,
                capacity,
                reintegrated,
                educationRecords = educationRecordCount,
                healthVisits,
                utilization
            };
        });

        return Ok(result);
    }

    // GET /api/reports/reintegration?year=2024
    [HttpGet("reintegration")]
    public async Task<IActionResult> GetReintegration([FromQuery] int year = 0)
    {
        if (year == 0) year = DateTime.UtcNow.Year;

        var residents = await _db.Residents
            .Where(r => r.DateClosed.HasValue && r.DateClosed.Value.Year == year &&
                        !string.IsNullOrEmpty(r.ReintegrationType))
            .ToListAsync();

        var total = residents.Count;

        var byType = residents
            .GroupBy(r => string.IsNullOrWhiteSpace(r.ReintegrationType) ? "Other" : r.ReintegrationType)
            .Select(g => new
            {
                type = g.Key,
                count = g.Count(),
                percentage = total > 0 ? Math.Round((double)g.Count() / total * 100, 1) : 0
            })
            .OrderByDescending(x => x.count);

        return Ok(new { total, breakdown = byType });
    }
}
