using INTEX_II.Data;
using INTEX_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/home-visitation")]
public class HomeVisitationController : ControllerBase
{
    private readonly AppDbContext _db;

    public HomeVisitationController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/home-visitation/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var upcomingCount = await _db.HomeVisitations.CountAsync(v => v.VisitDate > today);
        var followUpCount = await _db.HomeVisitations.CountAsync(v => v.FollowUpNeeded);
        var safetyCount = await _db.HomeVisitations.CountAsync(v => v.SafetyConcernsNoted);

        return Ok(new { upcomingCount, followUpCount, safetyCount });
    }

    // GET /api/home-visitation/upcoming-visits
    [HttpGet("upcoming-visits")]
    public async Task<IActionResult> GetUpcomingVisits()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var visits = await _db.HomeVisitations
            .Include(v => v.Resident)
            .Where(v => v.VisitDate > today)
            .OrderBy(v => v.VisitDate)
            .Take(5)
            .Select(v => new
            {
                visitationId = v.VisitationId,
                visitDate = v.VisitDate.ToString("yyyy-MM-dd"),
                visitType = v.VisitType,
                locationVisited = v.LocationVisited,
                socialWorker = v.SocialWorker,
                residentCaseNo = v.Resident != null ? v.Resident.CaseControlNo : "Unknown",
                followUpNeeded = v.FollowUpNeeded
            })
            .ToListAsync();

        return Ok(visits);
    }

    // GET /api/home-visitation/historical-logs?page=1&pageSize=15
    [HttpGet("historical-logs")]
    public async Task<IActionResult> GetHistoricalLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 15)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var query = _db.HomeVisitations
            .Include(v => v.Resident)
            .Where(v => v.VisitDate <= today)
            .OrderByDescending(v => v.VisitDate);

        var total = await query.CountAsync();

        var logs = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new
            {
                visitationId = v.VisitationId,
                visitDate = v.VisitDate.ToString("MMM d, yyyy"),
                visitType = v.VisitType,
                locationVisited = v.LocationVisited,
                socialWorker = v.SocialWorker,
                residentCaseNo = v.Resident != null ? v.Resident.CaseControlNo : "Unknown",
                purpose = v.Purpose,
                familyMembersPresent = v.FamilyMembersPresent,
                observations = v.Observations ?? string.Empty,
                followUpNeeded = v.FollowUpNeeded,
                followUpNotes = v.FollowUpNotes ?? string.Empty,
                visitOutcome = v.VisitOutcome,
                familyCooperationLevel = v.FamilyCooperationLevel,
                safetyConcernsNoted = v.SafetyConcernsNoted
            })
            .ToListAsync();

        return Ok(new { data = logs, total, page, pageSize });
    }

    // GET /api/home-visitation/residents
    [HttpGet("residents")]
    public async Task<IActionResult> GetResidents()
    {
        var residents = await _db.Residents
            .Where(r => r.DateClosed == null)
            .OrderBy(r => r.CaseControlNo)
            .Select(r => new
            {
                residentId = r.ResidentId,
                caseControlNo = r.CaseControlNo
            })
            .ToListAsync();

        return Ok(residents);
    }

    // GET /api/home-visitation/social-workers
    [HttpGet("social-workers")]
    public async Task<IActionResult> GetSocialWorkers()
    {
        var workers = await _db.HomeVisitations
            .Where(v => !string.IsNullOrEmpty(v.SocialWorker))
            .Select(v => v.SocialWorker)
            .Distinct()
            .OrderBy(w => w)
            .ToListAsync();

        return Ok(workers);
    }

    // PUT /api/home-visitation/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVisit(int id, [FromBody] UpdateVisitRequest request)
    {
        var visit = await _db.HomeVisitations.FindAsync(id);
        if (visit == null) return NotFound();

        visit.VisitType = request.VisitType;
        visit.SocialWorker = request.SocialWorker;
        visit.LocationVisited = request.LocationVisited;
        visit.Purpose = request.Purpose;
        visit.FamilyMembersPresent = request.FamilyMembersPresent;
        visit.Observations = request.Observations;
        visit.FamilyCooperationLevel = request.FamilyCooperationLevel;
        visit.SafetyConcernsNoted = request.SafetyConcernsNoted;
        visit.FollowUpNeeded = request.FollowUpNeeded;
        visit.FollowUpNotes = request.FollowUpNotes ?? string.Empty;
        visit.VisitOutcome = request.VisitOutcome;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/home-visitation/schedule
    // Schedules a future visit
    [HttpPost("schedule")]
    public async Task<IActionResult> ScheduleVisit([FromBody] ScheduleVisitRequest request)
    {
        var visit = new HomeVisitation
        {
            ResidentId = request.ResidentId,
            VisitDate = DateOnly.Parse(request.VisitDate),
            SocialWorker = request.SocialWorker,
            VisitType = request.VisitType,
            LocationVisited = request.LocationVisited,
            FamilyMembersPresent = string.Empty,
            Purpose = request.VisitType,
            Observations = string.Empty,
            FamilyCooperationLevel = string.Empty,
            SafetyConcernsNoted = false,
            FollowUpNeeded = false,
            FollowUpNotes = string.Empty,
            VisitOutcome = "Scheduled"
        };

        _db.HomeVisitations.Add(visit);
        await _db.SaveChangesAsync();

        return Ok(new { visitationId = visit.VisitationId });
    }

    // DELETE /api/home-visitation/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVisit(int id)
    {
        var visit = await _db.HomeVisitations.FindAsync(id);
        if (visit == null) return NotFound();

        _db.HomeVisitations.Remove(visit);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/home-visitation/log
    [HttpPost("log")]
    public async Task<IActionResult> LogVisit([FromBody] LogVisitRequest request)
    {
        var visit = new HomeVisitation
        {
            ResidentId = request.ResidentId,
            VisitDate = DateOnly.FromDateTime(DateTime.UtcNow),
            SocialWorker = request.SocialWorker,
            VisitType = request.VisitType,
            LocationVisited = request.LocationVisited,
            Purpose = request.Purpose,
            FamilyMembersPresent = request.FamilyMembersPresent,
            Observations = request.Observations,
            FamilyCooperationLevel = request.FamilyCooperationLevel,
            SafetyConcernsNoted = request.SafetyConcernsNoted,
            FollowUpNeeded = request.FollowUpNeeded,
            FollowUpNotes = request.FollowUpNotes ?? string.Empty,
            VisitOutcome = request.VisitOutcome,
        };

        _db.HomeVisitations.Add(visit);
        await _db.SaveChangesAsync();

        return Ok(new { visitationId = visit.VisitationId });
    }
}

public class ScheduleVisitRequest
{
    public int ResidentId { get; set; }
    public string VisitDate { get; set; } = string.Empty;
    public string SocialWorker { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty;
    public string LocationVisited { get; set; } = string.Empty;
}

public class LogVisitRequest
{
    public int ResidentId { get; set; }
    public string SocialWorker { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty;
    public string LocationVisited { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string FamilyMembersPresent { get; set; } = string.Empty;
    public string Observations { get; set; } = string.Empty;
    public string FamilyCooperationLevel { get; set; } = string.Empty;
    public bool SafetyConcernsNoted { get; set; }
    public bool FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    public string VisitOutcome { get; set; } = string.Empty;
}

public class UpdateVisitRequest
{
    public string SocialWorker { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty;
    public string LocationVisited { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string FamilyMembersPresent { get; set; } = string.Empty;
    public string Observations { get; set; } = string.Empty;
    public string FamilyCooperationLevel { get; set; } = string.Empty;
    public bool SafetyConcernsNoted { get; set; }
    public bool FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    public string VisitOutcome { get; set; } = string.Empty;
}
