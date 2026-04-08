using INTEX_II.Data;
using INTEX_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/residents")]
public class ResidentController : ControllerBase
{
    private readonly AppDbContext _db;

    public ResidentController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/residents/safehouses — must be before {id} route to avoid ambiguity
    [HttpGet("safehouses")]
    public async Task<IActionResult> GetSafehouses()
    {
        var result = await _db.Safehouses
            .OrderBy(s => s.Name)
            .Select(s => new
            {
                safehouseId = s.SafehouseId,
                safehouseCode = s.SafehouseCode,
                name = s.Name,
                city = s.City,
                province = s.Province,
            })
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/residents?search=&caseStatus=&safehouseId=&caseCategory=
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? caseStatus,
        [FromQuery] int? safehouseId,
        [FromQuery] string? caseCategory)
    {
        var query = _db.Residents.Include(r => r.Safehouse).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(r =>
                r.CaseControlNo.Contains(search) ||
                r.InternalCode.Contains(search) ||
                r.AssignedSocialWorker.Contains(search));

        if (!string.IsNullOrWhiteSpace(caseStatus))
            query = query.Where(r => r.CaseStatus == caseStatus);

        if (safehouseId.HasValue)
            query = query.Where(r => r.SafehouseId == safehouseId.Value);

        if (!string.IsNullOrWhiteSpace(caseCategory))
            query = query.Where(r => r.CaseCategory == caseCategory);

        // Step 1: fetch raw columns from DB (array construction can't be translated to SQL)
        var raw = await query
            .OrderByDescending(r => r.DateOfAdmission)
            .Select(r => new
            {
                r.ResidentId,
                r.CaseControlNo,
                r.InternalCode,
                r.SafehouseId,
                SafehouseName = r.Safehouse != null ? r.Safehouse.Name : "",
                r.CaseStatus,
                r.CaseCategory,
                r.SubCatOrphaned,
                r.SubCatTrafficked,
                r.SubCatChildLabor,
                r.SubCatPhysicalAbuse,
                r.SubCatSexualAbuse,
                r.SubCatOsaec,
                r.SubCatCicl,
                r.SubCatAtRisk,
                r.SubCatStreetChild,
                r.SubCatChildWithHiv,
                r.DateOfAdmission,
                r.AssignedSocialWorker,
                r.CurrentRiskLevel,
                r.InitialRiskLevel,
            })
            .ToListAsync();

        // Step 2: build subCategories in memory
        var result = raw.Select(r => new
        {
            residentId = r.ResidentId,
            caseControlNo = r.CaseControlNo,
            internalCode = r.InternalCode,
            safehouseId = r.SafehouseId,
            safehouseName = r.SafehouseName,
            caseStatus = r.CaseStatus,
            caseCategory = r.CaseCategory,
            subCategories = new[]
            {
                r.SubCatOrphaned     ? "Orphaned"       : null,
                r.SubCatTrafficked   ? "Trafficked"     : null,
                r.SubCatChildLabor   ? "Child Labor"    : null,
                r.SubCatPhysicalAbuse? "Physical Abuse" : null,
                r.SubCatSexualAbuse  ? "Sexual Abuse"   : null,
                r.SubCatOsaec        ? "OSAEC"          : null,
                r.SubCatCicl         ? "CICL"           : null,
                r.SubCatAtRisk       ? "At Risk"        : null,
                r.SubCatStreetChild  ? "Street Child"   : null,
                r.SubCatChildWithHiv ? "Child w/ HIV"   : null,
            }.Where(s => s != null).ToArray(),
            dateOfAdmission = r.DateOfAdmission,
            assignedSocialWorker = r.AssignedSocialWorker,
            currentRiskLevel = r.CurrentRiskLevel,
            initialRiskLevel = r.InitialRiskLevel,
        });

        return Ok(result);
    }

    // GET /api/residents/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _db.Residents.Include(r => r.Safehouse).FirstOrDefaultAsync(r => r.ResidentId == id);
        if (r == null) return NotFound();

        return Ok(new
        {
            residentId = r.ResidentId,
            caseControlNo = r.CaseControlNo,
            internalCode = r.InternalCode,
            safehouseId = r.SafehouseId,
            safehouseName = r.Safehouse != null ? r.Safehouse.Name : "",
            caseStatus = r.CaseStatus,
            sex = r.Sex,
            dateOfBirth = r.DateOfBirth,
            birthStatus = r.BirthStatus,
            placeOfBirth = r.PlaceOfBirth,
            religion = r.Religion,
            caseCategory = r.CaseCategory,
            subCatOrphaned = r.SubCatOrphaned,
            subCatTrafficked = r.SubCatTrafficked,
            subCatChildLabor = r.SubCatChildLabor,
            subCatPhysicalAbuse = r.SubCatPhysicalAbuse,
            subCatSexualAbuse = r.SubCatSexualAbuse,
            subCatOsaec = r.SubCatOsaec,
            subCatCicl = r.SubCatCicl,
            subCatAtRisk = r.SubCatAtRisk,
            subCatStreetChild = r.SubCatStreetChild,
            subCatChildWithHiv = r.SubCatChildWithHiv,
            isPwd = r.IsPwd,
            pwdType = r.PwdType,
            hasSpecialNeeds = r.HasSpecialNeeds,
            specialNeedsDiagnosis = r.SpecialNeedsDiagnosis,
            familyIs4Ps = r.FamilyIs4Ps,
            familySoloParent = r.FamilySoloParent,
            familyIndigenous = r.FamilyIndigenous,
            familyParentPwd = r.FamilyParentPwd,
            familyInformalSettler = r.FamilyInformalSettler,
            dateOfAdmission = r.DateOfAdmission,
            ageUponAdmission = r.AgeUponAdmission,
            presentAge = r.PresentAge,
            lengthOfStay = r.LengthOfStay,
            referralSource = r.ReferralSource,
            referringAgencyPerson = r.ReferringAgencyPerson,
            dateColbRegistered = r.DateColbRegistered,
            dateColbObtained = r.DateColbObtained,
            assignedSocialWorker = r.AssignedSocialWorker,
            initialCaseAssessment = r.InitialCaseAssessment,
            dateCaseStudyPrepared = r.DateCaseStudyPrepared,
            reintegrationType = r.ReintegrationType,
            reintegrationStatus = r.ReintegrationStatus,
            initialRiskLevel = r.InitialRiskLevel,
            currentRiskLevel = r.CurrentRiskLevel,
            dateEnrolled = r.DateEnrolled,
            dateClosed = r.DateClosed,
            notesRestricted = r.NotesRestricted,
        });
    }

    // POST /api/residents
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ResidentCreateDto dto)
    {
        var entity = new Resident
        {
            CaseControlNo = dto.CaseControlNo,
            InternalCode = dto.InternalCode,
            SafehouseId = dto.SafehouseId,
            CaseStatus = dto.CaseStatus,
            Sex = dto.Sex,
            DateOfBirth = dto.DateOfBirth,
            BirthStatus = dto.BirthStatus,
            PlaceOfBirth = dto.PlaceOfBirth,
            Religion = dto.Religion,
            CaseCategory = dto.CaseCategory,
            SubCatOrphaned = dto.SubCatOrphaned,
            SubCatTrafficked = dto.SubCatTrafficked,
            SubCatChildLabor = dto.SubCatChildLabor,
            SubCatPhysicalAbuse = dto.SubCatPhysicalAbuse,
            SubCatSexualAbuse = dto.SubCatSexualAbuse,
            SubCatOsaec = dto.SubCatOsaec,
            SubCatCicl = dto.SubCatCicl,
            SubCatAtRisk = dto.SubCatAtRisk,
            SubCatStreetChild = dto.SubCatStreetChild,
            SubCatChildWithHiv = dto.SubCatChildWithHiv,
            IsPwd = dto.IsPwd,
            PwdType = dto.PwdType,
            HasSpecialNeeds = dto.HasSpecialNeeds,
            SpecialNeedsDiagnosis = dto.SpecialNeedsDiagnosis,
            FamilyIs4Ps = dto.FamilyIs4Ps,
            FamilySoloParent = dto.FamilySoloParent,
            FamilyIndigenous = dto.FamilyIndigenous,
            FamilyParentPwd = dto.FamilyParentPwd,
            FamilyInformalSettler = dto.FamilyInformalSettler,
            DateOfAdmission = dto.DateOfAdmission,
            AgeUponAdmission = dto.AgeUponAdmission,
            PresentAge = dto.PresentAge,
            LengthOfStay = dto.LengthOfStay,
            ReferralSource = dto.ReferralSource,
            ReferringAgencyPerson = dto.ReferringAgencyPerson,
            DateColbRegistered = dto.DateColbRegistered,
            DateColbObtained = dto.DateColbObtained,
            AssignedSocialWorker = dto.AssignedSocialWorker,
            InitialCaseAssessment = dto.InitialCaseAssessment,
            DateCaseStudyPrepared = dto.DateCaseStudyPrepared,
            ReintegrationType = dto.ReintegrationType,
            ReintegrationStatus = dto.ReintegrationStatus,
            InitialRiskLevel = dto.InitialRiskLevel,
            CurrentRiskLevel = dto.CurrentRiskLevel,
            DateEnrolled = dto.DateEnrolled,
            DateClosed = dto.DateClosed,
            NotesRestricted = dto.NotesRestricted,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Residents.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.ResidentId }, new { entity.ResidentId });
    }

    // PUT /api/residents/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ResidentUpdateDto dto)
    {
        var entity = await _db.Residents.FindAsync(id);
        if (entity == null) return NotFound();

        entity.CaseControlNo = dto.CaseControlNo;
        entity.InternalCode = dto.InternalCode;
        entity.SafehouseId = dto.SafehouseId;
        entity.CaseStatus = dto.CaseStatus;
        entity.Sex = dto.Sex;
        entity.DateOfBirth = dto.DateOfBirth;
        entity.BirthStatus = dto.BirthStatus;
        entity.PlaceOfBirth = dto.PlaceOfBirth;
        entity.Religion = dto.Religion;
        entity.CaseCategory = dto.CaseCategory;
        entity.SubCatOrphaned = dto.SubCatOrphaned;
        entity.SubCatTrafficked = dto.SubCatTrafficked;
        entity.SubCatChildLabor = dto.SubCatChildLabor;
        entity.SubCatPhysicalAbuse = dto.SubCatPhysicalAbuse;
        entity.SubCatSexualAbuse = dto.SubCatSexualAbuse;
        entity.SubCatOsaec = dto.SubCatOsaec;
        entity.SubCatCicl = dto.SubCatCicl;
        entity.SubCatAtRisk = dto.SubCatAtRisk;
        entity.SubCatStreetChild = dto.SubCatStreetChild;
        entity.SubCatChildWithHiv = dto.SubCatChildWithHiv;
        entity.IsPwd = dto.IsPwd;
        entity.PwdType = dto.PwdType;
        entity.HasSpecialNeeds = dto.HasSpecialNeeds;
        entity.SpecialNeedsDiagnosis = dto.SpecialNeedsDiagnosis;
        entity.FamilyIs4Ps = dto.FamilyIs4Ps;
        entity.FamilySoloParent = dto.FamilySoloParent;
        entity.FamilyIndigenous = dto.FamilyIndigenous;
        entity.FamilyParentPwd = dto.FamilyParentPwd;
        entity.FamilyInformalSettler = dto.FamilyInformalSettler;
        entity.DateOfAdmission = dto.DateOfAdmission;
        entity.AgeUponAdmission = dto.AgeUponAdmission;
        entity.PresentAge = dto.PresentAge;
        entity.LengthOfStay = dto.LengthOfStay;
        entity.ReferralSource = dto.ReferralSource;
        entity.ReferringAgencyPerson = dto.ReferringAgencyPerson;
        entity.DateColbRegistered = dto.DateColbRegistered;
        entity.DateColbObtained = dto.DateColbObtained;
        entity.AssignedSocialWorker = dto.AssignedSocialWorker;
        entity.InitialCaseAssessment = dto.InitialCaseAssessment;
        entity.DateCaseStudyPrepared = dto.DateCaseStudyPrepared;
        entity.ReintegrationType = dto.ReintegrationType;
        entity.ReintegrationStatus = dto.ReintegrationStatus;
        entity.InitialRiskLevel = dto.InitialRiskLevel;
        entity.CurrentRiskLevel = dto.CurrentRiskLevel;
        entity.DateEnrolled = dto.DateEnrolled;
        entity.DateClosed = dto.DateClosed;
        entity.NotesRestricted = dto.NotesRestricted;

        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record ResidentCreateDto(
    string CaseControlNo,
    string InternalCode,
    int SafehouseId,
    string CaseStatus,
    string Sex,
    DateOnly? DateOfBirth,
    string BirthStatus,
    string PlaceOfBirth,
    string Religion,
    string CaseCategory,
    bool SubCatOrphaned,
    bool SubCatTrafficked,
    bool SubCatChildLabor,
    bool SubCatPhysicalAbuse,
    bool SubCatSexualAbuse,
    bool SubCatOsaec,
    bool SubCatCicl,
    bool SubCatAtRisk,
    bool SubCatStreetChild,
    bool SubCatChildWithHiv,
    bool IsPwd,
    string? PwdType,
    bool HasSpecialNeeds,
    string? SpecialNeedsDiagnosis,
    bool FamilyIs4Ps,
    bool FamilySoloParent,
    bool FamilyIndigenous,
    bool FamilyParentPwd,
    bool FamilyInformalSettler,
    DateOnly DateOfAdmission,
    string AgeUponAdmission,
    string PresentAge,
    string? LengthOfStay,
    string? ReferralSource,
    string? ReferringAgencyPerson,
    DateOnly? DateColbRegistered,
    DateOnly? DateColbObtained,
    string AssignedSocialWorker,
    string InitialCaseAssessment,
    DateOnly? DateCaseStudyPrepared,
    string ReintegrationType,
    string ReintegrationStatus,
    string InitialRiskLevel,
    string CurrentRiskLevel,
    DateOnly? DateEnrolled,
    DateOnly? DateClosed,
    string NotesRestricted
);

public record ResidentUpdateDto(
    int ResidentId,
    string CaseControlNo,
    string InternalCode,
    int SafehouseId,
    string CaseStatus,
    string Sex,
    DateOnly? DateOfBirth,
    string BirthStatus,
    string PlaceOfBirth,
    string Religion,
    string CaseCategory,
    bool SubCatOrphaned,
    bool SubCatTrafficked,
    bool SubCatChildLabor,
    bool SubCatPhysicalAbuse,
    bool SubCatSexualAbuse,
    bool SubCatOsaec,
    bool SubCatCicl,
    bool SubCatAtRisk,
    bool SubCatStreetChild,
    bool SubCatChildWithHiv,
    bool IsPwd,
    string? PwdType,
    bool HasSpecialNeeds,
    string? SpecialNeedsDiagnosis,
    bool FamilyIs4Ps,
    bool FamilySoloParent,
    bool FamilyIndigenous,
    bool FamilyParentPwd,
    bool FamilyInformalSettler,
    DateOnly DateOfAdmission,
    string AgeUponAdmission,
    string PresentAge,
    string? LengthOfStay,
    string? ReferralSource,
    string? ReferringAgencyPerson,
    DateOnly? DateColbRegistered,
    DateOnly? DateColbObtained,
    string AssignedSocialWorker,
    string InitialCaseAssessment,
    DateOnly? DateCaseStudyPrepared,
    string ReintegrationType,
    string ReintegrationStatus,
    string InitialRiskLevel,
    string CurrentRiskLevel,
    DateOnly? DateEnrolled,
    DateOnly? DateClosed,
    string NotesRestricted
);
