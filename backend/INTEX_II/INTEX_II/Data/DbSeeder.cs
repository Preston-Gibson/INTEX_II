using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using CsvHelper.TypeConversion;
using INTEX_II.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace INTEX_II.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, string csvDataPath, bool forceReseed = false)
    {
        if (forceReseed)
        {
            Console.WriteLine("[Seeder] ForceReseed enabled — clearing all seeded tables...");
            await db.Database.ExecuteSqlRawAsync(@"
                TRUNCATE TABLE
                    public_impact_snapshots,
                    partner_assignments,
                    safehouse_monthly_metrics,
                    intervention_plans,
                    incident_reports,
                    education_records,
                    health_wellbeing_records,
                    home_visitations,
                    process_recordings,
                    in_kind_donation_items,
                    donation_allocations,
                    donations,
                    social_media_posts,
                    residents,
                    partners,
                    supporters,
                    safehouses
                RESTART IDENTITY CASCADE;
            ");
            Console.WriteLine("[Seeder] All seeded tables cleared.");
        }

        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HeaderValidated = null,
            MissingFieldFound = null,
            BadDataFound = null,
            PrepareHeaderForMatch = args => args.Header.Replace("_", "").ToLower(),
        };

        // Seed order respects foreign key dependencies
        await SeedTable(db, csvDataPath, "safehouses.csv", config,
            () => db.Safehouses.Any(),
            (reader, cfg) => ReadRecords<Safehouse>(reader, cfg));

        await SeedTable(db, csvDataPath, "supporters.csv", config,
            () => db.Supporters.Any(),
            (reader, cfg) => ReadRecords<Supporter>(reader, cfg));

        await SeedTable(db, csvDataPath, "partners.csv", config,
            () => db.Partners.Any(),
            (reader, cfg) => ReadRecords<Partner>(reader, cfg));

        await SeedTable(db, csvDataPath, "social_media_posts.csv", config,
            () => db.SocialMediaPosts.Any(),
            (reader, cfg) => ReadRecords<SocialMediaPost>(reader, cfg));

        await SeedTable(db, csvDataPath, "residents.csv", config,
            () => db.Residents.Any(),
            (reader, cfg) => ReadRecords<Resident>(reader, cfg));

        await SeedTable(db, csvDataPath, "donations.csv", config,
            () => db.Donations.Any(),
            (reader, cfg) => ReadRecords<Donation>(reader, cfg));

        await SeedTable(db, csvDataPath, "donation_allocations.csv", config,
            () => db.DonationAllocations.Any(),
            (reader, cfg) => ReadRecords<DonationAllocation>(reader, cfg));

        await SeedTable(db, csvDataPath, "in_kind_donation_items.csv", config,
            () => db.InKindDonationItems.Any(),
            (reader, cfg) => ReadRecords<InKindDonationItem>(reader, cfg));

        await SeedTable(db, csvDataPath, "process_recordings.csv", config,
            () => db.ProcessRecordings.Any(),
            (reader, cfg) => ReadRecords<ProcessRecording>(reader, cfg));

        await SeedTable(db, csvDataPath, "home_visitations.csv", config,
            () => db.HomeVisitations.Any(),
            (reader, cfg) => ReadRecords<HomeVisitation>(reader, cfg));

        await SeedTable(db, csvDataPath, "health_wellbeing_records.csv", config,
            () => db.HealthWellbeingRecords.Any(),
            (reader, cfg) => ReadRecords<HealthWellbeingRecord>(reader, cfg));

        await SeedTable(db, csvDataPath, "education_records.csv", config,
            () => db.EducationRecords.Any(),
            (reader, cfg) => ReadRecords<EducationRecord>(reader, cfg));

        await SeedTable(db, csvDataPath, "incident_reports.csv", config,
            () => db.IncidentReports.Any(),
            (reader, cfg) => ReadRecords<IncidentReport>(reader, cfg));

        await SeedTable(db, csvDataPath, "intervention_plans.csv", config,
            () => db.InterventionPlans.Any(),
            (reader, cfg) => ReadRecords<InterventionPlan>(reader, cfg));

        await SeedTable(db, csvDataPath, "safehouse_monthly_metrics.csv", config,
            () => db.SafehouseMonthlyMetrics.Any(),
            (reader, cfg) => ReadRecords<SafehouseMonthlyMetric>(reader, cfg));

        await SeedTable(db, csvDataPath, "partner_assignments.csv", config,
            () => db.PartnerAssignments.Any(),
            (reader, cfg) => ReadPartnerAssignments(reader));

        await SeedTable(db, csvDataPath, "public_impact_snapshots.csv", config,
            () => db.PublicImpactSnapshots.Any(),
            (reader, cfg) => ReadRecords<PublicImpactSnapshot>(reader, cfg));

        await ResetSequencesAsync(db);
    }

    /// <summary>
    /// Resets all PostgreSQL sequences to MAX(id) so that EF Core inserts
    /// don't collide with rows that were loaded via CSV seeding.
    /// Safe to run on every startup — it's a no-op when no rows exist.
    /// </summary>
    public static async Task ResetSequencesAsync(AppDbContext db)
    {
        Console.WriteLine("[Seeder] Resetting PostgreSQL sequences…");
        await db.Database.ExecuteSqlRawAsync(@"
            SELECT setval(pg_get_serial_sequence('safehouses',               'safehouse_id'),  COALESCE(MAX(safehouse_id),  1)) FROM safehouses;
            SELECT setval(pg_get_serial_sequence('supporters',               'supporter_id'),  COALESCE(MAX(supporter_id),  1)) FROM supporters;
            SELECT setval(pg_get_serial_sequence('partners',                 'partner_id'),    COALESCE(MAX(partner_id),    1)) FROM partners;
            SELECT setval(pg_get_serial_sequence('social_media_posts',       'post_id'),       COALESCE(MAX(post_id),       1)) FROM social_media_posts;
            SELECT setval(pg_get_serial_sequence('residents',                'resident_id'),   COALESCE(MAX(resident_id),   1)) FROM residents;
            SELECT setval(pg_get_serial_sequence('donations',                'donation_id'),   COALESCE(MAX(donation_id),   1)) FROM donations;
            SELECT setval(pg_get_serial_sequence('donation_allocations',     'allocation_id'), COALESCE(MAX(allocation_id), 1)) FROM donation_allocations;
            SELECT setval(pg_get_serial_sequence('in_kind_donation_items',   'item_id'),       COALESCE(MAX(item_id),       1)) FROM in_kind_donation_items;
            SELECT setval(pg_get_serial_sequence('process_recordings',       'recording_id'),  COALESCE(MAX(recording_id),  1)) FROM process_recordings;
            SELECT setval(pg_get_serial_sequence('home_visitations',         'visitation_id'), COALESCE(MAX(visitation_id), 1)) FROM home_visitations;
            SELECT setval(pg_get_serial_sequence('health_wellbeing_records', 'health_record_id'),    COALESCE(MAX(health_record_id),    1)) FROM health_wellbeing_records;
            SELECT setval(pg_get_serial_sequence('education_records',        'education_record_id'), COALESCE(MAX(education_record_id), 1)) FROM education_records;
            SELECT setval(pg_get_serial_sequence('incident_reports',         'incident_id'),   COALESCE(MAX(incident_id),   1)) FROM incident_reports;
            SELECT setval(pg_get_serial_sequence('intervention_plans',       'plan_id'),       COALESCE(MAX(plan_id),       1)) FROM intervention_plans;
            SELECT setval(pg_get_serial_sequence('safehouse_monthly_metrics','metric_id'),     COALESCE(MAX(metric_id),     1)) FROM safehouse_monthly_metrics;
            SELECT setval(pg_get_serial_sequence('partner_assignments',      'assignment_id'), COALESCE(MAX(assignment_id), 1)) FROM partner_assignments;
            SELECT setval(pg_get_serial_sequence('public_impact_snapshots',  'snapshot_id'),   COALESCE(MAX(snapshot_id),   1)) FROM public_impact_snapshots;
        ");
        Console.WriteLine("[Seeder] Sequences reset.");
    }

    private static async Task SeedTable<T>(
        AppDbContext db,
        string csvDataPath,
        string fileName,
        CsvConfiguration config,
        Func<bool> alreadySeeded,
        Func<StreamReader, CsvConfiguration, IEnumerable<T>> readFn) where T : class
    {
        var filePath = Path.Combine(csvDataPath, fileName);
        if (!File.Exists(filePath))
        {
            Console.WriteLine($"[Seeder] Skipping {fileName}: file not found at {filePath}");
            return;
        }

        if (alreadySeeded())
        {
            Console.WriteLine($"[Seeder] Skipping {fileName}: data already exists");
            return;
        }

        using var reader = new StreamReader(filePath);
        var records = readFn(reader, config).ToList();

        // Use Entry().State instead of AddRange to bypass EF Core's graph traversal,
        // which causes duplicate-tracking errors when multiple rows share the same FK value.
        foreach (var record in records)
            db.Entry(record).State = EntityState.Added;

        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        Console.WriteLine($"[Seeder] Inserted {records.Count} records from {fileName}");
    }

    private static IEnumerable<T> ReadRecords<T>(StreamReader reader, CsvConfiguration config)
    {
        using var csv = new CsvReader(reader, config);
        csv.Context.TypeConverterCache.AddConverter<DateOnly>(new DateOnlyConverter());
        csv.Context.TypeConverterCache.AddConverter<DateOnly?>(new NullableDateOnlyConverter());
        csv.Context.TypeConverterCache.AddConverter<DateTime>(new UtcDateTimeConverter());
        csv.Context.TypeConverterCache.AddConverter<DateTime?>(new NullableUtcDateTimeConverter());
        csv.Context.TypeConverterCache.AddConverter<int>(new FlexibleIntConverter());
        csv.Context.TypeConverterCache.AddConverter<int?>(new NullableFlexibleIntConverter());
        csv.Context.TypeConverterCache.AddConverter<decimal>(new FlexibleDecimalConverter());
        csv.Context.TypeConverterCache.AddConverter<decimal?>(new NullableFlexibleDecimalConverter());
        return csv.GetRecords<T>().ToList();
    }

    // Partner assignments have safehouse_id stored as float (e.g. "8.0"), needs special handling
    private static IEnumerable<PartnerAssignment> ReadPartnerAssignments(StreamReader reader)
    {
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HeaderValidated = null,
            MissingFieldFound = null,
            BadDataFound = null,
        };

        using var csv = new CsvReader(reader, config);
        csv.Context.TypeConverterCache.AddConverter<DateOnly>(new DateOnlyConverter());
        csv.Context.TypeConverterCache.AddConverter<DateOnly?>(new NullableDateOnlyConverter());
        csv.Read();
        csv.ReadHeader();

        var results = new List<PartnerAssignment>();
        while (csv.Read())
        {
            var assignment = new PartnerAssignment
            {
                AssignmentId = csv.GetField<int>("assignment_id"),
                PartnerId = csv.GetField<int>("partner_id"),
                SafehouseId = ParseNullableInt(csv.GetField("safehouse_id")),
                ProgramArea = csv.GetField("program_area") ?? string.Empty,
                AssignmentStart = DateOnly.Parse(csv.GetField("assignment_start")!),
                AssignmentEnd = ParseNullableDateOnly(csv.GetField("assignment_end")),
                ResponsibilityNotes = csv.GetField("responsibility_notes") ?? string.Empty,
                IsPrimary = bool.Parse(csv.GetField("is_primary") ?? "false"),
                Status = csv.GetField("status") ?? string.Empty,
            };
            results.Add(assignment);
        }
        return results;
    }

    private static int? ParseNullableInt(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (double.TryParse(value.Trim(), out var d)) return (int)d;
        return null;
    }

    private static DateOnly? ParseNullableDateOnly(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return DateOnly.Parse(value.Trim());
    }
}

public class FlexibleIntConverter : DefaultTypeConverter
{
    public override object? ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        if (double.TryParse(text.Trim(), out var d)) return (int)d;
        throw new TypeConverterException(this, memberMapData, text, row.Context, $"Cannot convert '{text}' to int.");
    }
}

public class NullableFlexibleIntConverter : DefaultTypeConverter
{
    public override object? ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        if (double.TryParse(text.Trim(), out var d)) return (int)d;
        return null;
    }
}

public class FlexibleDecimalConverter : DefaultTypeConverter
{
    public override object? ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0m;
        if (decimal.TryParse(text.Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var d)) return d;
        throw new TypeConverterException(this, memberMapData, text, row.Context, $"Cannot convert '{text}' to decimal.");
    }
}

public class NullableFlexibleDecimalConverter : DefaultTypeConverter
{
    public override object? ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        if (decimal.TryParse(text.Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var d)) return d;
        return null;
    }
}

public class UtcDateTimeConverter : DefaultTypeConverter
{
    public override object? ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text)) return default(DateTime);
        return DateTime.SpecifyKind(DateTime.Parse(text.Trim()), DateTimeKind.Utc);
    }
}

public class NullableUtcDateTimeConverter : DefaultTypeConverter
{
    public override object? ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        return DateTime.SpecifyKind(DateTime.Parse(text.Trim()), DateTimeKind.Utc);
    }
}

public class DateOnlyConverter : DefaultTypeConverter
{
    public override object? ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text)) return default(DateOnly);
        return DateOnly.Parse(text.Trim());
    }
}

public class NullableDateOnlyConverter : DefaultTypeConverter
{
    public override object? ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        if (DateOnly.TryParse(text.Trim(), out var result)) return result;
        return null;
    }
}
