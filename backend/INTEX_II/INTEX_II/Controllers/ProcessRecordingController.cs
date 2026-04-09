using INTEX_II.Data;
using INTEX_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/process-recordings")]
public class ProcessRecordingController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProcessRecordingController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/process-recordings/residents
    [HttpGet("residents")]
    public async Task<IActionResult> GetResidents([FromQuery] string? search)
    {
        var query = _db.Residents
            .Include(r => r.Safehouse)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(r =>
                r.CaseControlNo.ToLower().Contains(s) ||
                r.InternalCode.ToLower().Contains(s) ||
                r.AssignedSocialWorker.ToLower().Contains(s));
        }

        var result = await query
            .OrderBy(r => r.CaseControlNo)
            .Select(r => new
            {
                r.ResidentId,
                r.CaseControlNo,
                r.InternalCode,
                r.AssignedSocialWorker,
                r.CaseStatus,
                SafehouseName = r.Safehouse != null ? r.Safehouse.Name : "Unknown"
            })
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/process-recordings?residentId=X
    [HttpGet]
    public async Task<IActionResult> GetRecordings([FromQuery] int residentId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var recordings = await _db.ProcessRecordings
            .Where(p => p.ResidentId == residentId && p.SessionDate <= today)
            .OrderByDescending(p => p.SessionDate)
            .Select(p => new
            {
                p.RecordingId,
                p.ResidentId,
                SessionDate = p.SessionDate.ToString("yyyy-MM-dd"),
                p.SocialWorker,
                p.SessionType,
                p.SessionDurationMinutes,
                p.EmotionalStateObserved,
                p.EmotionalStateEnd,
                p.SessionNarrative,
                p.InterventionsApplied,
                p.FollowUpActions,
                p.ProgressNoted,
                p.ConcernsFlagged,
                p.ReferralMade
            })
            .ToListAsync();

        return Ok(recordings);
    }

    // POST /api/process-recordings
    [HttpPost]
    public async Task<IActionResult> CreateRecording([FromBody] ProcessRecordingDto dto)
    {
        var recording = new ProcessRecording
        {
            ResidentId = dto.ResidentId,
            SessionDate = DateOnly.Parse(dto.SessionDate),
            SocialWorker = dto.SocialWorker,
            SessionType = dto.SessionType,
            SessionDurationMinutes = dto.SessionDurationMinutes,
            EmotionalStateObserved = dto.EmotionalStateObserved,
            EmotionalStateEnd = dto.EmotionalStateEnd,
            SessionNarrative = dto.SessionNarrative,
            InterventionsApplied = dto.InterventionsApplied,
            FollowUpActions = dto.FollowUpActions,
            ProgressNoted = dto.ProgressNoted,
            ConcernsFlagged = dto.ConcernsFlagged,
            ReferralMade = dto.ReferralMade,
            NotesRestricted = ""
        };

        _db.ProcessRecordings.Add(recording);
        await _db.SaveChangesAsync();

        return Ok(new { recording.RecordingId });
    }

    // PUT /api/process-recordings/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRecording(int id, [FromBody] ProcessRecordingDto dto)
    {
        var recording = await _db.ProcessRecordings.FindAsync(id);
        if (recording == null) return NotFound();

        recording.SessionDate = DateOnly.Parse(dto.SessionDate);
        recording.SocialWorker = dto.SocialWorker;
        recording.SessionType = dto.SessionType;
        recording.SessionDurationMinutes = dto.SessionDurationMinutes;
        recording.EmotionalStateObserved = dto.EmotionalStateObserved;
        recording.EmotionalStateEnd = dto.EmotionalStateEnd;
        recording.SessionNarrative = dto.SessionNarrative;
        recording.InterventionsApplied = dto.InterventionsApplied;
        recording.FollowUpActions = dto.FollowUpActions;
        recording.ProgressNoted = dto.ProgressNoted;
        recording.ConcernsFlagged = dto.ConcernsFlagged;
        recording.ReferralMade = dto.ReferralMade;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/process-recordings/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecording(int id)
    {
        var recording = await _db.ProcessRecordings.FindAsync(id);
        if (recording == null) return NotFound();

        _db.ProcessRecordings.Remove(recording);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class ProcessRecordingDto
{
    public int ResidentId { get; set; }
    public string SessionDate { get; set; } = string.Empty;
    public string SocialWorker { get; set; } = string.Empty;
    public string SessionType { get; set; } = string.Empty;
    public int SessionDurationMinutes { get; set; }
    public string EmotionalStateObserved { get; set; } = string.Empty;
    public string EmotionalStateEnd { get; set; } = string.Empty;
    public string SessionNarrative { get; set; } = string.Empty;
    public string InterventionsApplied { get; set; } = string.Empty;
    public string FollowUpActions { get; set; } = string.Empty;
    public bool ProgressNoted { get; set; }
    public bool ConcernsFlagged { get; set; }
    public bool ReferralMade { get; set; }
}
