namespace INTEX_II.Models;

public class PartnerAssignment
{
    public int AssignmentId { get; set; }
    public int PartnerId { get; set; }
    public int? SafehouseId { get; set; }
    public string ProgramArea { get; set; } = string.Empty;
    public DateOnly AssignmentStart { get; set; }
    public DateOnly? AssignmentEnd { get; set; }
    public string ResponsibilityNotes { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public string Status { get; set; } = string.Empty;

    public Partner? Partner { get; set; }
    public Safehouse? Safehouse { get; set; }
}
