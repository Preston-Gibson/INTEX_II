using INTEX_II.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[ApiController]
[Route("api/donor-dashboard")]
public class DonorDashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DonorDashboardController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/donor-dashboard/stats
    // Returns the three top-level stat cards: residents served, reintegrations, education hours
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var residentsServed = await _db.Residents.CountAsync();

        var successfulReintegrations = await _db.Residents
            .CountAsync(r => r.ReintegrationStatus != null &&
                             r.ReintegrationStatus.ToLower().Contains("complet"));

        var totalEducationMinutes = await _db.ProcessRecordings
            .SumAsync(p => (long)p.SessionDurationMinutes);

        var educationHours = totalEducationMinutes / 60;

        return Ok(new
        {
            residentsServed,
            successfulReintegrations,
            educationHours
        });
    }

    // GET /api/donor-dashboard/geographic-reach
    // Returns safehouse counts grouped by country with percentages
    [HttpGet("geographic-reach")]
    public async Task<IActionResult> GetGeographicReach()
    {
        var bySafehouse = await _db.Safehouses
            .Where(s => s.Status == "Active")
            .GroupBy(s => s.Country)
            .Select(g => new { country = g.Key, count = g.Count() })
            .ToListAsync();

        var total = bySafehouse.Sum(x => x.count);

        var result = bySafehouse
            .OrderByDescending(x => x.count)
            .Select(x => new
            {
                x.country,
                x.count,
                percentage = total > 0 ? Math.Round((double)x.count / total * 100, 1) : 0
            });

        return Ok(result);
    }

    // GET /api/donor-dashboard/yearly-impact
    // Returns resident admission counts grouped by year for the bar chart
    [HttpGet("yearly-impact")]
    public async Task<IActionResult> GetYearlyImpact()
    {
        var byYear = await _db.Residents
            .GroupBy(r => r.DateOfAdmission.Year)
            .Select(g => new { year = g.Key, residentCount = g.Count() })
            .OrderBy(x => x.year)
            .ToListAsync();

        return Ok(byYear);
    }

    // GET /api/donor-dashboard/donation-allocation
    // Returns donation allocation breakdown by program area
    [HttpGet("donation-allocation")]
    public async Task<IActionResult> GetDonationAllocation()
    {
        var byProgram = await _db.DonationAllocations
            .GroupBy(a => a.ProgramArea)
            .Select(g => new
            {
                programArea = g.Key,
                totalAllocated = g.Sum(a => a.AmountAllocated)
            })
            .ToListAsync();

        var grandTotal = byProgram.Sum(x => x.totalAllocated);

        var result = byProgram
            .OrderByDescending(x => x.totalAllocated)
            .Select(x => new
            {
                x.programArea,
                x.totalAllocated,
                percentage = grandTotal > 0
                    ? Math.Round((double)(x.totalAllocated / grandTotal) * 100, 1)
                    : 0
            });

        return Ok(result);
    }
}
