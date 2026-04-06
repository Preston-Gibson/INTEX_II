namespace INTEX_II.Models;

public class PublicImpactSnapshot
{
    public int SnapshotId { get; set; }
    public DateOnly SnapshotDate { get; set; }
    public string Headline { get; set; } = string.Empty;
    public string SummaryText { get; set; } = string.Empty;
    public string MetricPayloadJson { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public DateOnly? PublishedAt { get; set; }
}
