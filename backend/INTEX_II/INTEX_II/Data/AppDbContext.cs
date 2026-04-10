using INTEX_II.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Safehouse> Safehouses => Set<Safehouse>();
    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<ProcessRecording> ProcessRecordings => Set<ProcessRecording>();
    public DbSet<HomeVisitation> HomeVisitations => Set<HomeVisitation>();
    public DbSet<SocialMediaPost> SocialMediaPosts => Set<SocialMediaPost>();
    public DbSet<SocialMediaPrediction> SocialMediaPredictions => Set<SocialMediaPrediction>();
    public DbSet<Supporter> Supporters => Set<Supporter>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<DonationAllocation> DonationAllocations => Set<DonationAllocation>();
    public DbSet<InKindDonationItem> InKindDonationItems => Set<InKindDonationItem>();
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords => Set<HealthWellbeingRecord>();
    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();
    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics => Set<SafehouseMonthlyMetric>();
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
    public DbSet<InterventionPlan> InterventionPlans => Set<InterventionPlan>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerAssignment> PartnerAssignments => Set<PartnerAssignment>();
    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots => Set<PublicImpactSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Explicit PKs for entities where the property name doesn't follow
        // the {ClassName}Id convention that EF Core auto-detects
        modelBuilder.Entity<ProcessRecording>().HasKey(e => e.RecordingId);
        modelBuilder.Entity<HomeVisitation>().HasKey(e => e.VisitationId);
        modelBuilder.Entity<SocialMediaPost>().HasKey(e => e.PostId);
        modelBuilder.Entity<SocialMediaPrediction>().HasKey(e => e.PostId);
        modelBuilder.Entity<DonationAllocation>().HasKey(e => e.AllocationId);
        modelBuilder.Entity<InKindDonationItem>().HasKey(e => e.ItemId);
        modelBuilder.Entity<HealthWellbeingRecord>().HasKey(e => e.HealthRecordId);
        modelBuilder.Entity<SafehouseMonthlyMetric>().HasKey(e => e.MetricId);
        modelBuilder.Entity<IncidentReport>().HasKey(e => e.IncidentId);
        modelBuilder.Entity<InterventionPlan>().HasKey(e => e.PlanId);
        modelBuilder.Entity<PartnerAssignment>().HasKey(e => e.AssignmentId);
        modelBuilder.Entity<PublicImpactSnapshot>().HasKey(e => e.SnapshotId);

        // Resident → Safehouse
        modelBuilder.Entity<Resident>()
            .HasOne(r => r.Safehouse)
            .WithMany(s => s.Residents)
            .HasForeignKey(r => r.SafehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        // ProcessRecording → Resident
        modelBuilder.Entity<ProcessRecording>()
            .HasOne(p => p.Resident)
            .WithMany(r => r.ProcessRecordings)
            .HasForeignKey(p => p.ResidentId)
            .OnDelete(DeleteBehavior.Cascade);

        // HomeVisitation → Resident
        modelBuilder.Entity<HomeVisitation>()
            .HasOne(h => h.Resident)
            .WithMany(r => r.HomeVisitations)
            .HasForeignKey(h => h.ResidentId)
            .OnDelete(DeleteBehavior.Cascade);

        // HealthWellbeingRecord → Resident
        modelBuilder.Entity<HealthWellbeingRecord>()
            .HasOne(h => h.Resident)
            .WithMany(r => r.HealthRecords)
            .HasForeignKey(h => h.ResidentId)
            .OnDelete(DeleteBehavior.Cascade);

        // EducationRecord → Resident
        modelBuilder.Entity<EducationRecord>()
            .HasOne(e => e.Resident)
            .WithMany(r => r.EducationRecords)
            .HasForeignKey(e => e.ResidentId)
            .OnDelete(DeleteBehavior.Cascade);

        // IncidentReport → Resident
        modelBuilder.Entity<IncidentReport>()
            .HasOne(i => i.Resident)
            .WithMany(r => r.IncidentReports)
            .HasForeignKey(i => i.ResidentId)
            .OnDelete(DeleteBehavior.Cascade);

        // IncidentReport → Safehouse
        modelBuilder.Entity<IncidentReport>()
            .HasOne(i => i.Safehouse)
            .WithMany(s => s.IncidentReports)
            .HasForeignKey(i => i.SafehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        // InterventionPlan → Resident
        modelBuilder.Entity<InterventionPlan>()
            .HasOne(p => p.Resident)
            .WithMany(r => r.InterventionPlans)
            .HasForeignKey(p => p.ResidentId)
            .OnDelete(DeleteBehavior.Cascade);

        // SafehouseMonthlyMetric → Safehouse
        modelBuilder.Entity<SafehouseMonthlyMetric>()
            .HasOne(m => m.Safehouse)
            .WithMany(s => s.MonthlyMetrics)
            .HasForeignKey(m => m.SafehouseId)
            .OnDelete(DeleteBehavior.Cascade);

        // Donation → Supporter
        modelBuilder.Entity<Donation>()
            .HasOne(d => d.Supporter)
            .WithMany(s => s.Donations)
            .HasForeignKey(d => d.SupporterId)
            .OnDelete(DeleteBehavior.Restrict);

        // Donation → SocialMediaPost (optional referral)
        modelBuilder.Entity<Donation>()
            .HasOne(d => d.ReferralPost)
            .WithMany(p => p.ReferralDonations)
            .HasForeignKey(d => d.ReferralPostId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // DonationAllocation → Donation
        modelBuilder.Entity<DonationAllocation>()
            .HasOne(a => a.Donation)
            .WithMany(d => d.Allocations)
            .HasForeignKey(a => a.DonationId)
            .OnDelete(DeleteBehavior.Cascade);

        // DonationAllocation → Safehouse
        modelBuilder.Entity<DonationAllocation>()
            .HasOne(a => a.Safehouse)
            .WithMany(s => s.DonationAllocations)
            .HasForeignKey(a => a.SafehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        // InKindDonationItem → Donation
        modelBuilder.Entity<InKindDonationItem>()
            .HasOne(i => i.Donation)
            .WithMany(d => d.InKindItems)
            .HasForeignKey(i => i.DonationId)
            .OnDelete(DeleteBehavior.Cascade);

        // PartnerAssignment → Partner
        modelBuilder.Entity<PartnerAssignment>()
            .HasOne(a => a.Partner)
            .WithMany(p => p.Assignments)
            .HasForeignKey(a => a.PartnerId)
            .OnDelete(DeleteBehavior.Cascade);

        // PartnerAssignment → Safehouse (optional: some assignments have no safehouse)
        modelBuilder.Entity<PartnerAssignment>()
            .HasOne(a => a.Safehouse)
            .WithMany(s => s.PartnerAssignments)
            .HasForeignKey(a => a.SafehouseId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
