using System.IdentityModel.Tokens.Jwt;
using INTEX_II.Data;
using INTEX_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[Authorize(Roles = "Donor,Admin")]
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

    // GET /api/donor-dashboard/my-donations
    // Returns the logged-in donor's donation history and lifetime total
    [HttpGet("my-donations")]
    public async Task<IActionResult> GetMyDonations()
    {
        var email = User.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var supporter = await _db.Supporters.FirstOrDefaultAsync(s => s.Email == email);

        if (supporter is null)
            return Ok(new { lifetimeTotal = 0m, donations = Array.Empty<object>() });

        var donations = await _db.Donations
            .Where(d => d.SupporterId == supporter.SupporterId)
            .OrderByDescending(d => d.DonationDate)
            .Select(d => new
            {
                d.DonationId,
                d.DonationType,
                d.DonationDate,
                d.Amount,
                d.CurrencyCode,
                d.EstimatedValue,
                d.CampaignName,
                d.IsRecurring,
                d.Notes
            })
            .ToListAsync();

        var lifetimeTotal = donations.Sum(d => d.EstimatedValue);

        return Ok(new { lifetimeTotal, donations });
    }

    // POST /api/donor-dashboard/my-donations
    // Records a new monetary donation for the logged-in donor
    [HttpPost("my-donations")]
    public async Task<IActionResult> SubmitDonation([FromBody] SubmitDonationDto dto)
    {
        var email = User.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var supporter = await _db.Supporters.FirstOrDefaultAsync(s => s.Email == email);
        if (supporter is null)
        {
            // Auto-create a supporter record for self-registered donors
            supporter = new Supporter
            {
                Email              = email,
                FirstName          = string.Empty,
                LastName           = string.Empty,
                DisplayName        = email,
                OrganizationName   = string.Empty,
                SupporterType      = "Monetary Donor",
                RelationshipType   = "Individual",
                Region             = string.Empty,
                Country            = string.Empty,
                Phone              = string.Empty,
                Status             = "Active",
                CreatedAt          = DateTime.UtcNow,
                AcquisitionChannel = "Self-Registration",
            };
            await _db.Database.ExecuteSqlRawAsync(
                "SELECT setval('supporters_supporter_id_seq', GREATEST((SELECT MAX(supporter_id) FROM supporters), nextval('supporters_supporter_id_seq') - 1))");
            _db.Supporters.Add(supporter);
            await _db.SaveChangesAsync();
        }

        if (dto.Amount <= 0)
            return BadRequest("Amount must be greater than zero.");

        var donation = new Donation
        {
            SupporterId    = supporter.SupporterId,
            DonationType   = "Monetary",
            DonationDate   = DateOnly.FromDateTime(DateTime.UtcNow),
            IsRecurring    = dto.IsRecurring,
            CampaignName   = dto.CampaignName,
            CurrencyCode   = "USD",
            Amount         = dto.Amount,
            EstimatedValue = dto.Amount,
            ImpactUnit     = "dollars",
            Notes          = dto.Notes
        };

        // Ensure the sequence is ahead of any CSV-seeded rows
        await _db.Database.ExecuteSqlRawAsync(
            "SELECT setval('donations_donation_id_seq', GREATEST((SELECT MAX(donation_id) FROM donations), nextval('donations_donation_id_seq') - 1))");

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();

        return Ok(new { donation.DonationId });
    }

    // POST /api/donor-dashboard/my-inkind-donations
    // Records a new in-kind donation request for the logged-in donor
    [HttpPost("my-inkind-donations")]
    public async Task<IActionResult> SubmitInKindDonation([FromBody] SubmitInKindDonationDto dto)
    {
        var email = User.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var supporter = await _db.Supporters.FirstOrDefaultAsync(s => s.Email == email);
        if (supporter is null)
        {
            supporter = new Supporter
            {
                Email              = email,
                FirstName          = string.Empty,
                LastName           = string.Empty,
                DisplayName        = email,
                OrganizationName   = string.Empty,
                SupporterType      = "In-Kind Donor",
                RelationshipType   = "Individual",
                Region             = string.Empty,
                Country            = string.Empty,
                Phone              = string.Empty,
                Status             = "Active",
                CreatedAt          = DateTime.UtcNow,
                AcquisitionChannel = "Self-Registration",
            };
            await _db.Database.ExecuteSqlRawAsync(
                "SELECT setval('supporters_supporter_id_seq', GREATEST((SELECT MAX(supporter_id) FROM supporters), nextval('supporters_supporter_id_seq') - 1))");
            _db.Supporters.Add(supporter);
            await _db.SaveChangesAsync();
        }

        if (dto.Items is null || dto.Items.Count == 0)
            return BadRequest("At least one item is required.");

        var itemSummary = string.Join("; ",
            dto.Items.Select(i => $"{i.Quantity} {i.UnitOfMeasure} {i.ItemName} ({i.ItemCategory})"));
        var notes = $"[In-Kind Items] {itemSummary}";
        if (!string.IsNullOrWhiteSpace(dto.Notes))
            notes += $"\n{dto.Notes}";

        var donation = new Donation
        {
            SupporterId    = supporter.SupporterId,
            DonationType   = "InKind",
            DonationDate   = DateOnly.FromDateTime(DateTime.UtcNow),
            IsRecurring    = false,
            CampaignName   = dto.CampaignName,
            CurrencyCode   = null,
            Amount         = null,
            EstimatedValue = 0,
            ImpactUnit     = "items",
            Notes          = notes
        };

        foreach (var item in dto.Items)
        {
            donation.InKindItems.Add(new InKindDonationItem
            {
                ItemName           = item.ItemName,
                ItemCategory       = item.ItemCategory,
                Quantity           = item.Quantity,
                UnitOfMeasure      = item.UnitOfMeasure,
                EstimatedUnitValue = 0,
                IntendedUse        = "General",
                ReceivedCondition  = "Pending",
            });
        }

        await _db.Database.ExecuteSqlRawAsync(
            "SELECT setval('donations_donation_id_seq', GREATEST((SELECT MAX(donation_id) FROM donations), nextval('donations_donation_id_seq') - 1))");
        await _db.Database.ExecuteSqlRawAsync(
            "SELECT setval('in_kind_donation_items_item_id_seq', GREATEST((SELECT MAX(item_id) FROM in_kind_donation_items), nextval('in_kind_donation_items_item_id_seq') - 1))");

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();

        return Ok(new { donation.DonationId });
    }

    // POST /api/donor-dashboard/my-time-donations
    // Records a new volunteer / time-donation request for the logged-in donor
    [HttpPost("my-time-donations")]
    public async Task<IActionResult> SubmitTimeDonation([FromBody] SubmitTimeDonationDto dto)
    {
        var email = User.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var supporter = await _db.Supporters.FirstOrDefaultAsync(s => s.Email == email);
        if (supporter is null)
        {
            supporter = new Supporter
            {
                Email              = email,
                FirstName          = string.Empty,
                LastName           = string.Empty,
                DisplayName        = email,
                OrganizationName   = string.Empty,
                SupporterType      = "Volunteer",
                RelationshipType   = "Individual",
                Region             = string.Empty,
                Country            = string.Empty,
                Phone              = string.Empty,
                Status             = "Active",
                CreatedAt          = DateTime.UtcNow,
                AcquisitionChannel = "Self-Registration",
            };
            await _db.Database.ExecuteSqlRawAsync(
                "SELECT setval('supporters_supporter_id_seq', GREATEST((SELECT MAX(supporter_id) FROM supporters), nextval('supporters_supporter_id_seq') - 1))");
            _db.Supporters.Add(supporter);
            await _db.SaveChangesAsync();
        }

        if (string.IsNullOrWhiteSpace(dto.FullName))
            return BadRequest("Full name is required.");

        var donation = new Donation
        {
            SupporterId    = supporter.SupporterId,
            DonationType   = "Time",
            DonationDate   = DateOnly.FromDateTime(DateTime.UtcNow),
            IsRecurring    = false,
            CampaignName   = dto.CampaignName,
            CurrencyCode   = null,
            Amount         = null,
            EstimatedValue = 0,
            ImpactUnit     = "hours",
            Notes          = $"[Volunteer Request] {dto.FullName} | {dto.Email ?? email} | {dto.Phone ?? "—"}\nAvailability: {dto.Availability ?? "—"}\n{dto.Notes ?? ""}"
        };

        await _db.Database.ExecuteSqlRawAsync(
            "SELECT setval('donations_donation_id_seq', GREATEST((SELECT MAX(donation_id) FROM donations), nextval('donations_donation_id_seq') - 1))");

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();

        return Ok(new { donation.DonationId });
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

public record SubmitDonationDto(
    decimal Amount,
    string? CampaignName,
    bool IsRecurring,
    string? Notes
);

public record InKindItemDto(
    string ItemName,
    string ItemCategory,
    int Quantity,
    string UnitOfMeasure
);

public record SubmitInKindDonationDto(
    List<InKindItemDto> Items,
    string? CampaignName,
    string? Notes
);

public record SubmitTimeDonationDto(
    string FullName,
    string? Email,
    string? Phone,
    string? Availability,
    string? CampaignName,
    string? Notes
);
