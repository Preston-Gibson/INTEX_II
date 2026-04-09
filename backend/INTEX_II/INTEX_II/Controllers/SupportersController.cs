using INTEX_II.Data;
using INTEX_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/supporters")]
public class SupportersController : ControllerBase
{
    private readonly AppDbContext _db;

    public SupportersController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/supporters
    [HttpGet]
    public async Task<IActionResult> GetSupporters(
        [FromQuery] string? search,
        [FromQuery] string? supporterType,
        [FromQuery] string? status)
    {
        var query = _db.Supporters.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(x =>
                x.DisplayName.ToLower().Contains(s) ||
                x.FirstName.ToLower().Contains(s) ||
                x.LastName.ToLower().Contains(s) ||
                x.Email.ToLower().Contains(s) ||
                x.OrganizationName.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(supporterType))
            query = query.Where(x => x.SupporterType == supporterType);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status);

        var result = await query
            .OrderBy(x => x.DisplayName)
            .Select(x => new
            {
                x.SupporterId,
                x.DisplayName,
                x.SupporterType,
                x.RelationshipType,
                x.Region,
                x.Country,
                x.Email,
                x.Status,
                x.CreatedAt,
                x.FirstDonationDate,
                x.AcquisitionChannel,
                DonationCount = x.Donations.Count,
                TotalEstimatedValue = x.Donations.Sum(d => d.EstimatedValue)
            })
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/supporters/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetSupporter(int id)
    {
        var supporter = await _db.Supporters
            .Where(x => x.SupporterId == id)
            .Select(x => new
            {
                x.SupporterId,
                x.SupporterType,
                x.DisplayName,
                x.OrganizationName,
                x.FirstName,
                x.LastName,
                x.RelationshipType,
                x.Region,
                x.Country,
                x.Email,
                x.Phone,
                x.Status,
                x.CreatedAt,
                x.FirstDonationDate,
                x.AcquisitionChannel
            })
            .FirstOrDefaultAsync();

        if (supporter is null) return NotFound();
        return Ok(supporter);
    }

    // POST /api/supporters
    [HttpPost]
    public async Task<IActionResult> CreateSupporter([FromBody] SupporterDto dto)
    {
        var supporter = new Supporter
        {
            SupporterType      = dto.SupporterType,
            DisplayName        = dto.DisplayName,
            OrganizationName   = dto.OrganizationName,
            FirstName          = dto.FirstName,
            LastName           = dto.LastName,
            RelationshipType   = dto.RelationshipType,
            Region             = dto.Region,
            Country            = dto.Country,
            Email              = dto.Email,
            Phone              = dto.Phone,
            Status             = dto.Status,
            CreatedAt          = DateTime.UtcNow,
            FirstDonationDate  = dto.FirstDonationDate,
            AcquisitionChannel = dto.AcquisitionChannel
        };
        _db.Supporters.Add(supporter);
        await _db.SaveChangesAsync();
        return Ok(supporter.SupporterId);
    }

    // PUT /api/supporters/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSupporter(int id, [FromBody] SupporterDto dto)
    {
        var supporter = await _db.Supporters.FindAsync(id);
        if (supporter is null) return NotFound();

        supporter.SupporterType      = dto.SupporterType;
        supporter.DisplayName        = dto.DisplayName;
        supporter.OrganizationName   = dto.OrganizationName;
        supporter.FirstName          = dto.FirstName;
        supporter.LastName           = dto.LastName;
        supporter.RelationshipType   = dto.RelationshipType;
        supporter.Region             = dto.Region;
        supporter.Country            = dto.Country;
        supporter.Email              = dto.Email;
        supporter.Phone              = dto.Phone;
        supporter.Status             = dto.Status;
        supporter.FirstDonationDate  = dto.FirstDonationDate;
        supporter.AcquisitionChannel = dto.AcquisitionChannel;

        await _db.SaveChangesAsync();
        return Ok();
    }

    // GET /api/supporters/{id}/donations
    [HttpGet("{id}/donations")]
    public async Task<IActionResult> GetDonations(int id)
    {
        var exists = await _db.Supporters.AnyAsync(s => s.SupporterId == id);
        if (!exists) return NotFound();

        var donations = await _db.Donations
            .Where(d => d.SupporterId == id)
            .OrderByDescending(d => d.DonationDate)
            .Select(d => new
            {
                d.DonationId,
                d.DonationType,
                d.DonationDate,
                d.IsRecurring,
                d.CampaignName,
                d.ChannelSource,
                d.CurrencyCode,
                d.Amount,
                d.EstimatedValue,
                d.ImpactUnit,
                d.Notes,
                d.IsReviewed,
                Allocations = d.Allocations.Select(a => new
                {
                    a.AllocationId,
                    a.SafehouseId,
                    SafehouseName = a.Safehouse != null ? a.Safehouse.Name : string.Empty,
                    a.ProgramArea,
                    a.AmountAllocated,
                    a.AllocationDate,
                    a.AllocationNotes
                }).ToList()
            })
            .ToListAsync();

        return Ok(donations);
    }

    // POST /api/supporters/{id}/donations
    [HttpPost("{id}/donations")]
    public async Task<IActionResult> CreateDonation(int id, [FromBody] DonationDto dto)
    {
        var supporter = await _db.Supporters.FindAsync(id);
        if (supporter is null) return NotFound();

        var donation = new Donation
        {
            SupporterId    = id,
            DonationType   = dto.DonationType,
            DonationDate   = dto.DonationDate,
            IsRecurring    = dto.IsRecurring,
            CampaignName   = dto.CampaignName,
            ChannelSource  = dto.ChannelSource,
            CurrencyCode   = dto.CurrencyCode,
            Amount         = dto.Amount,
            EstimatedValue = dto.EstimatedValue,
            ImpactUnit     = dto.ImpactUnit,
            Notes          = dto.Notes
        };
        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();
        return Ok(donation.DonationId);
    }

    // PATCH /api/supporters/donations/{donationId}/review
    [HttpPatch("donations/{donationId}/review")]
    public async Task<IActionResult> ToggleReview(int donationId, [FromBody] ToggleReviewDto dto)
    {
        var donation = await _db.Donations.FindAsync(donationId);
        if (donation is null) return NotFound();

        donation.IsReviewed = dto.IsReviewed;
        await _db.SaveChangesAsync();
        return Ok();
    }

    // GET /api/supporters/donations  – all donations across all supporters
    [HttpGet("donations")]
    public async Task<IActionResult> GetAllDonations(
        [FromQuery] string? search,
        [FromQuery] string? donationType)
    {
        var query = _db.Donations
            .Include(d => d.Supporter)
            .Include(d => d.Allocations)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(d =>
                (d.Supporter != null && d.Supporter.DisplayName.ToLower().Contains(s)) ||
                (d.CampaignName != null && d.CampaignName.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(donationType))
            query = query.Where(d => d.DonationType == donationType);

        var result = await query
            .OrderByDescending(d => d.DonationDate)
            .Select(d => new
            {
                d.DonationId,
                d.SupporterId,
                SupporterName = d.Supporter != null ? d.Supporter.DisplayName : string.Empty,
                d.DonationType,
                d.DonationDate,
                d.IsRecurring,
                d.CampaignName,
                d.ChannelSource,
                d.CurrencyCode,
                d.Amount,
                d.EstimatedValue,
                d.ImpactUnit,
                d.Notes,
                d.IsReviewed,
                AllocationCount = d.Allocations.Count,
                Allocations = d.Allocations.Select(a => new
                {
                    a.AllocationId,
                    a.SafehouseId,
                    SafehouseName = a.Safehouse != null ? a.Safehouse.Name : string.Empty,
                    a.ProgramArea,
                    a.AmountAllocated,
                    a.AllocationDate,
                    a.AllocationNotes
                }).ToList()
            })
            .ToListAsync();

        return Ok(result);
    }
}

public record SupporterDto(
    string SupporterType,
    string DisplayName,
    string OrganizationName,
    string FirstName,
    string LastName,
    string RelationshipType,
    string Region,
    string Country,
    string Email,
    string Phone,
    string Status,
    DateOnly? FirstDonationDate,
    string AcquisitionChannel
);

public record ToggleReviewDto(bool IsReviewed);

public record DonationDto(
    string DonationType,
    DateOnly? DonationDate,
    bool IsRecurring,
    string? CampaignName,
    string? ChannelSource,
    string? CurrencyCode,
    decimal? Amount,
    decimal EstimatedValue,
    string ImpactUnit,
    string? Notes
);
