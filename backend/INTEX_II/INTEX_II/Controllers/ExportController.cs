using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using ClosedXML.Excel;
using CsvHelper;
using INTEX_II.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[ApiController]
[Route("api/export")]
public class ExportController : ControllerBase
{
    private readonly AppDbContext _db;

    private const string TaxAcknowledgment =
        "No goods or services were provided in exchange for this contribution to Lucera, a 501(c)(3) organization.";

    public ExportController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/export/donations?format=csv|xlsx&year=YYYY
    [Authorize(Roles = "Admin")]
    [HttpGet("donations")]
    public async Task<IActionResult> ExportDonations([FromQuery] string format = "csv", [FromQuery] int? year = null)
    {
        var query = _db.Donations
            .Include(d => d.Supporter)
            .AsQueryable();

        if (year.HasValue)
            query = query.Where(d => d.DonationDate != null && d.DonationDate.Value.Year == year.Value);

        var rows = await query
            .OrderByDescending(d => d.DonationDate)
            .Select(d => new object[]
            {
                d.DonationId,
                d.Supporter != null ? d.Supporter.DisplayName : string.Empty,
                d.Supporter != null ? d.Supporter.Email : string.Empty,
                d.Supporter != null ? d.Supporter.RelationshipType : string.Empty,
                d.DonationType,
                d.DonationDate.HasValue ? d.DonationDate.Value.ToString("yyyy-MM-dd") : string.Empty,
                d.Amount.HasValue ? (object)d.Amount.Value : string.Empty,
                d.CurrencyCode ?? string.Empty,
                d.EstimatedValue,
                d.ImpactUnit,
                d.IsRecurring ? "Yes" : "No",
                d.CampaignName ?? string.Empty,
                d.ChannelSource ?? string.Empty,
                d.Notes ?? string.Empty
            })
            .ToListAsync();

        string[] headers =
        [
            "Donation ID", "Donor Name", "Donor Email", "Relationship Type",
            "Donation Type", "Donation Date", "Amount", "Currency",
            "Estimated Value", "Impact Unit", "Recurring", "Campaign Name",
            "Channel Source", "Notes"
        ];

        string fileName = year.HasValue ? $"donations_{year}.{format}" : $"donations_all.{format}";
        return BuildFile(rows, headers, format, fileName);
    }

    // GET /api/export/tax-report?format=csv|xlsx&year=YYYY
    [Authorize(Roles = "Admin")]
    [HttpGet("tax-report")]
    public async Task<IActionResult> ExportTaxReport([FromQuery] string format = "xlsx", [FromQuery] int? year = null)
    {
        var query = _db.Donations
            .Include(d => d.Supporter)
            .AsQueryable();

        if (year.HasValue)
            query = query.Where(d => d.DonationDate != null && d.DonationDate.Value.Year == year.Value);

        var rows = await query
            .OrderBy(d => d.Supporter != null ? d.Supporter.DisplayName : string.Empty)
            .ThenByDescending(d => d.DonationDate)
            .Select(d => new object[]
            {
                d.DonationDate.HasValue ? d.DonationDate.Value.ToString("yyyy-MM-dd") : string.Empty,
                d.Supporter != null ? d.Supporter.DisplayName : string.Empty,
                d.Supporter != null ? d.Supporter.Email : string.Empty,
                d.Supporter != null ? d.Supporter.OrganizationName : string.Empty,
                d.Supporter != null ? d.Supporter.RelationshipType : string.Empty,
                d.DonationType,
                d.DonationType == "Monetary" && d.Amount.HasValue ? (object)d.Amount.Value : "N/A",
                d.CurrencyCode ?? string.Empty,
                d.EstimatedValue,
                d.IsRecurring ? "Yes" : "No",
                d.CampaignName ?? string.Empty,
                d.DonationType == "Monetary" ? TaxAcknowledgment : "N/A"
            })
            .ToListAsync();

        string[] headers =
        [
            "Donation Date", "Donor Name", "Donor Email", "Organization Name",
            "Relationship Type", "Donation Type", "Amount", "Currency",
            "Estimated Value", "Recurring", "Campaign Name", "Tax Acknowledgment"
        ];

        string fileName = year.HasValue ? $"tax_report_{year}.{format}" : $"tax_report_all.{format}";
        return BuildFile(rows, headers, format, fileName);
    }

    // GET /api/export/my-tax-receipt?format=csv|xlsx&year=YYYY
    [Authorize(Roles = "Donor")]
    [HttpGet("my-tax-receipt")]
    public async Task<IActionResult> ExportMyTaxReceipt([FromQuery] string format = "xlsx", [FromQuery] int? year = null)
    {
        var email = User.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(email))
            return Unauthorized();

        var supporter = await _db.Supporters
            .FirstOrDefaultAsync(s => s.Email == email);

        if (supporter is null)
            return NotFound("No supporter record found for your account.");

        var query = _db.Donations
            .Where(d => d.SupporterId == supporter.SupporterId);

        if (year.HasValue)
            query = query.Where(d => d.DonationDate != null && d.DonationDate.Value.Year == year.Value);

        var rows = await query
            .OrderByDescending(d => d.DonationDate)
            .Select(d => new object[]
            {
                d.DonationDate.HasValue ? d.DonationDate.Value.ToString("yyyy-MM-dd") : string.Empty,
                d.DonationType,
                d.DonationType == "Monetary" && d.Amount.HasValue ? (object)d.Amount.Value : "N/A",
                d.CurrencyCode ?? string.Empty,
                d.EstimatedValue,
                d.ImpactUnit,
                d.IsRecurring ? "Yes" : "No",
                d.CampaignName ?? string.Empty,
                d.DonationType == "Monetary" ? TaxAcknowledgment : "N/A"
            })
            .ToListAsync();

        string[] headers =
        [
            "Donation Date", "Donation Type", "Amount", "Currency",
            "Estimated Value", "Impact Unit", "Recurring", "Campaign Name",
            "Tax Acknowledgment"
        ];

        string safeEmail = email.Replace("@", "_").Replace(".", "_");
        string fileName = year.HasValue
            ? $"tax_receipt_{safeEmail}_{year}.{format}"
            : $"tax_receipt_{safeEmail}_all.{format}";

        return BuildFile(rows, headers, format, fileName);
    }

    private FileContentResult BuildFile(
        IEnumerable<object[]> rows,
        string[] headers,
        string format,
        string fileName)
    {
        if (format.Equals("xlsx", StringComparison.OrdinalIgnoreCase))
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Export");

            // Write header row
            for (int col = 0; col < headers.Length; col++)
            {
                var cell = ws.Cell(1, col + 1);
                cell.Value = headers[col];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#4A4E69");
                cell.Style.Font.FontColor = XLColor.White;
            }

            // Write data rows
            int rowIdx = 2;
            foreach (var row in rows)
            {
                for (int col = 0; col < row.Length; col++)
                {
                    var cell = ws.Cell(rowIdx, col + 1);
                    var val = row[col];
                    if (val is decimal d)
                        cell.Value = (double)d;
                    else if (val is int i)
                        cell.Value = i;
                    else
                        cell.Value = val?.ToString() ?? string.Empty;
                }
                rowIdx++;
            }

            ws.Columns().AdjustToContents();

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);

            Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{fileName}\"");
            return File(ms.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
        }
        else
        {
            using var ms = new MemoryStream();
            using var writer = new StreamWriter(ms, Encoding.UTF8);
            using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

            foreach (var h in headers)
                csv.WriteField(h);
            csv.NextRecord();

            foreach (var row in rows)
            {
                foreach (var val in row)
                    csv.WriteField(val?.ToString() ?? string.Empty);
                csv.NextRecord();
            }

            writer.Flush();

            Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{fileName}\"");
            return File(ms.ToArray(), "text/csv", fileName);
        }
    }
}
