using INTEX_II.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

// No [Authorize] — these endpoints feed the public-facing Impact page
[ApiController]
[Route("api/impact")]
public class ImpactController : ControllerBase
{
    private readonly AppDbContext _db;

    public ImpactController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/impact/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var residentsServed = await _db.Residents.CountAsync();

        var successfulReintegrations = await _db.Residents
            .CountAsync(r => r.ReintegrationStatus != null &&
                             r.ReintegrationStatus.ToLower().Contains("complet"));

        var totalEducationMinutes = await _db.ProcessRecordings
            .SumAsync(p => (long)p.SessionDurationMinutes);

        return Ok(new
        {
            residentsServed,
            successfulReintegrations,
            educationHours = totalEducationMinutes / 60
        });
    }

    // GET /api/impact/geographic-reach
    [HttpGet("geographic-reach")]
    public async Task<IActionResult> GetGeographicReach()
    {
        var bySafehouse = await _db.Safehouses
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

    // GET /api/impact/yearly-impact
    [HttpGet("yearly-impact")]
    public async Task<IActionResult> GetYearlyImpact()
    {
        var byYear = await _db.Residents
            .GroupBy(r => r.DateOfAdmission.Year)
            .Select(g => new { year = g.Key, count = g.Count() })
            .OrderBy(x => x.year)
            .ToListAsync();

        return Ok(byYear);
    }

    // GET /api/impact/safehouse-locations
    [HttpGet("safehouse-locations")]
    public async Task<IActionResult> GetSafehouseLocations()
    {
        var safehouses = await _db.Safehouses
            .Select(s => new
            {
                s.SafehouseId,
                s.Name,
                s.City,
                s.Province,
                s.Country,
                s.Region,
                s.Status,
                s.CurrentOccupancy,
                s.CapacityGirls
            })
            .ToListAsync();

        return Ok(safehouses);
    }

    // GET /api/impact/donation-allocation
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
                percentage = grandTotal > 0
                    ? Math.Round((double)(x.totalAllocated / grandTotal) * 100, 1)
                    : 0
            });

        return Ok(result);
    }

    // GET /api/impact/resident-origins
    // Groups residents by PlaceOfBirth to show origin cities on the map
    [HttpGet("resident-origins")]
    public async Task<IActionResult> GetResidentOrigins()
    {
        var origins = await _db.Residents
            .Where(r => !string.IsNullOrEmpty(r.PlaceOfBirth))
            .GroupBy(r => new { r.PlaceOfBirth })
            .Select(g => new
            {
                city = g.Key.PlaceOfBirth,
                count = g.Count()
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        return Ok(origins);
    }
}
