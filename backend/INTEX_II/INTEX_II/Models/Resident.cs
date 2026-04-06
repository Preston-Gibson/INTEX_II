namespace INTEX_II.Models;

public class Resident
{
    public int ResidentId { get; set; }
    public string CaseControlNo { get; set; } = string.Empty;
    public string InternalCode { get; set; } = string.Empty;
    public int SafehouseId { get; set; }
    public string CaseStatus { get; set; } = string.Empty;
    public string Sex { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string BirthStatus { get; set; } = string.Empty;
    public string PlaceOfBirth { get; set; } = string.Empty;
    public string Religion { get; set; } = string.Empty;
    public string CaseCategory { get; set; } = string.Empty;
    public bool SubCatOrphaned { get; set; }
    public bool SubCatTrafficked { get; set; }
    public bool SubCatChildLabor { get; set; }
    public bool SubCatPhysicalAbuse { get; set; }
    public bool SubCatSexualAbuse { get; set; }
    public bool SubCatOsaec { get; set; }
    public bool SubCatCicl { get; set; }
    public bool SubCatAtRisk { get; set; }
    public bool SubCatStreetChild { get; set; }
    public bool SubCatChildWithHiv { get; set; }
    public bool IsPwd { get; set; }
    public string? PwdType { get; set; }       // nullable: only populated when IsPwd = true
    public bool HasSpecialNeeds { get; set; }
    public string? SpecialNeedsDiagnosis { get; set; }
    public bool FamilyIs4Ps { get; set; }
    public bool FamilySoloParent { get; set; }
    public bool FamilyIndigenous { get; set; }
    public bool FamilyParentPwd { get; set; }
    public bool FamilyInformalSettler { get; set; }
    public DateOnly DateOfAdmission { get; set; }
    public string AgeUponAdmission { get; set; } = string.Empty;
    public string PresentAge { get; set; } = string.Empty;
    public string? LengthOfStay { get; set; }
    public string? ReferralSource { get; set; }
    public string? ReferringAgencyPerson { get; set; }
    public DateOnly? DateColbRegistered { get; set; }
    public DateOnly? DateColbObtained { get; set; }
    public string AssignedSocialWorker { get; set; } = string.Empty;
    public string InitialCaseAssessment { get; set; } = string.Empty;
    public DateOnly? DateCaseStudyPrepared { get; set; }  // nullable: can be empty (e.g. resident 3)
    public string ReintegrationType { get; set; } = string.Empty;
    public string ReintegrationStatus { get; set; } = string.Empty;
    public string InitialRiskLevel { get; set; } = string.Empty;
    public string CurrentRiskLevel { get; set; } = string.Empty;
    public DateOnly? DateEnrolled { get; set; }
    public DateOnly? DateClosed { get; set; }
    public DateTime CreatedAt { get; set; }
    public string NotesRestricted { get; set; } = string.Empty;

    public Safehouse? Safehouse { get; set; }
    public ICollection<ProcessRecording> ProcessRecordings { get; set; } = new List<ProcessRecording>();
    public ICollection<HomeVisitation> HomeVisitations { get; set; } = new List<HomeVisitation>();
    public ICollection<HealthWellbeingRecord> HealthRecords { get; set; } = new List<HealthWellbeingRecord>();
    public ICollection<EducationRecord> EducationRecords { get; set; } = new List<EducationRecord>();
    public ICollection<IncidentReport> IncidentReports { get; set; } = new List<IncidentReport>();
    public ICollection<InterventionPlan> InterventionPlans { get; set; } = new List<InterventionPlan>();
}
