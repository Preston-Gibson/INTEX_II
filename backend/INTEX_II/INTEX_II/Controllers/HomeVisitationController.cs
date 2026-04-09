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

    // GET /api/home-visitation/upcoming-visits
    // Returns upcoming home visits (today and future), soonest first, max 5
    [HttpGet("upcoming-visits")]
    public async Task<IActionResult> GetUpcomingVisits()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var visits = await _db.HomeVisitations
            .Include(v => v.Resident)
            .Where(v => v.VisitDate >= today)
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

    // GET /api/home-visitation/historical-logs
    // Returns past home visits, most recent first, max 10
    [HttpGet("historical-logs")]
    public async Task<IActionResult> GetHistoricalLogs()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var logs = await _db.HomeVisitations
            .Include(v => v.Resident)
            .Where(v => v.VisitDate < today)
            .OrderByDescending(v => v.VisitDate)
            .Take(10)
            .Select(v => new
            {
                visitationId = v.VisitationId,
                visitDate = v.VisitDate.ToString("MMM d, yyyy"),
                visitType = v.VisitType,
                locationVisited = v.LocationVisited,
                socialWorker = v.SocialWorker,
                residentCaseNo = v.Resident != null ? v.Resident.CaseControlNo : "Unknown",
                observations = v.Observations ?? string.Empty,
                followUpNeeded = v.FollowUpNeeded,
                visitOutcome = v.VisitOutcome,
                familyCooperationLevel = v.FamilyCooperationLevel,
                safetyConcernsNoted = v.SafetyConcernsNoted
            })
            .ToListAsync();

        return Ok(logs);
    }

    // GET /api/home-visitation/residents
    // Returns active residents (no discharge date) for the log outcome dropdown
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

    // PUT /api/home-visitation/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVisit(int id, [FromBody] ScheduleVisitRequest request)
    {
        var visit = await _db.HomeVisitations.FindAsync(id);
        if (visit == null) return NotFound();

        visit.VisitDate = DateOnly.Parse(request.VisitDate);
        visit.SocialWorker = request.SocialWorker;
        visit.VisitType = request.VisitType;
        visit.LocationVisited = request.LocationVisited;
        visit.Purpose = request.VisitType;

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
    // Logs a new home visit outcome
    [HttpPost("log")]
    public async Task<IActionResult> LogVisit([FromBody] LogVisitRequest request)
    {
        var visit = new HomeVisitation
        {
            ResidentId = request.ResidentId,
            VisitDate = DateOnly.FromDateTime(DateTime.UtcNow),
            SocialWorker = "SW-00",
            VisitType = request.VisitType,
            LocationVisited = request.LocationVisited,
            FamilyMembersPresent = string.Empty,
            Purpose = request.VisitType,
            Observations = request.Observations,
            FamilyCooperationLevel = request.FamilyCooperationLevel,
            SafetyConcernsNoted = request.SafetyConcernsNoted,
            FollowUpNeeded = request.FollowUpNeeded,
            FollowUpNotes = request.FollowUpNotes ?? string.Empty,
            VisitOutcome = "Pending"
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
    public string VisitType { get; set; } = string.Empty;
    public string Observations { get; set; } = string.Empty;
    public string FamilyCooperationLevel { get; set; } = string.Empty;
    public bool SafetyConcernsNoted { get; set; }
    public bool FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    public string LocationVisited { get; set; } = string.Empty;
}
