namespace INTEX_II.Models;

public class HomeVisitation
{
    public int VisitationId { get; set; }
    public int ResidentId { get; set; }
    public DateOnly VisitDate { get; set; }
    public string SocialWorker { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty;
    public string LocationVisited { get; set; } = string.Empty;
    public string FamilyMembersPresent { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string? Observations { get; set; }
    public string FamilyCooperationLevel { get; set; } = string.Empty;
    public bool SafetyConcernsNoted { get; set; }
    public bool FollowUpNeeded { get; set; }
    public string FollowUpNotes { get; set; } = string.Empty;
    public string VisitOutcome { get; set; } = string.Empty;

    public Resident? Resident { get; set; }
}
