# Lighthouse Sanctuary — INTEX II

## Frontend

## Backend

The backend is an ASP.NET Core Web API (.NET 10) using Entity Framework Core with a PostgreSQL database.

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [PostgreSQL](https://www.postgresql.org/download/) (any recent version)
- EF Core CLI tools:
  ```bash
  dotnet tool install --global dotnet-ef
  ```

---

### Database Setup

Two options — pick whichever is easier.

#### Option A: Restore from snapshot (faster)

A pre-seeded dump file (`lighthouse_seed.dump`) is available from the team at: _[add link here]_

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE intex_ii;"

# Restore
pg_restore -U postgres -d intex_ii -F c lighthouse_seed.dump
```

#### Option B: Migrate and seed from CSVs

```bash
# Install EF Core CLI if you don't have it
dotnet tool install --global dotnet-ef

cd backend/INTEX_II/INTEX_II
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Then in `appsettings.Development.json` set `SeedOnStartup: true` and run the app:
```bash
dotnet run
```
Wait for all 17 `[Seeder] Inserted...` lines, then stop the app and set `SeedOnStartup` back to `false`.

#### Option C: Force reseed (after updating CSVs)

If the CSV files have been updated and the database needs to reflect the new data, use `ForceReseed` instead of manually clearing tables:

In `appsettings.Development.json`:
```json
"DataSeeding": {
  "CsvDataPath": "../../../pipeline/data",
  "SeedOnStartup": true,
  "ForceReseed": true
}
```

Then run the app:
```bash
dotnet run
```

This will:
1. Truncate all 17 seeded tables (`RESTART IDENTITY CASCADE`) — FK constraints are handled automatically.
2. Re-insert all records from the updated CSVs in the correct dependency order.
3. Leave Identity/auth tables (`AspNetUsers`, roles, etc.) untouched.

After the reseed completes, set `ForceReseed` back to `false` to prevent wiping data on every restart.

#### Configure the connection string (both options)

Open `backend/INTEX_II/INTEX_II/appsettings.Development.json` and fill in your credentials:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=intex_ii;Username=postgres;Password=YOUR_PASSWORD"
}
```

---

### Recreating the Snapshot (maintainers only)

Only needed if the schema or seed data changes. Requires the .NET 10 SDK and the EF Core CLI:

```bash
dotnet tool install --global dotnet-ef
```

**1. Run migrations:**
```bash
cd backend/INTEX_II/INTEX_II
dotnet ef migrations add InitialCreate
dotnet ef database update
```

**2. Seed from CSV files:**

In `appsettings.Development.json` set `SeedOnStartup: true` and `ForceReseed: true` (to ensure clean state), then run the app:
```bash
dotnet run
```
Wait for all 17 `[Seeder] Inserted...` lines in the console, stop the app, and set both `SeedOnStartup` and `ForceReseed` back to `false`.

**3. Create the new snapshot:**
```bash
pg_dump -U postgres -d intex_ii -F c -f lighthouse_seed.dump
```

Share the updated dump file with the team.

> **Note:** The dump file is not committed to git — it contains resident case data for minors.

---

### Database Schema

17 tables across four domains:

**Residents & Services**
| Table | Description |
|---|---|
| `safehouses` | Physical safehouse locations |
| `residents` | Individual resident case records |
| `process_recordings` | Social worker session notes |
| `home_visitations` | Family visit records |
| `health_wellbeing_records` | Monthly health assessments |
| `education_records` | School enrollment and progress |
| `incident_reports` | Security/medical/behavioral incidents |
| `intervention_plans` | Case plans with goals and timelines |

**Donations & Supporters**
| Table | Description |
|---|---|
| `supporters` | Donors and volunteers |
| `donations` | Monetary and in-kind donation records |
| `donation_allocations` | How donations are split across safehouses |
| `in_kind_donation_items` | Itemized in-kind goods received |

**Partners**
| Table | Description |
|---|---|
| `partners` | External organizations and individuals |
| `partner_assignments` | Which partners are assigned to which safehouses |

**Analytics & Public Reporting**
| Table | Description |
|---|---|
| `safehouse_monthly_metrics` | Aggregated monthly stats per safehouse |
| `social_media_posts` | Social media engagement data |
| `public_impact_snapshots` | Published impact reports |

---

### Project Structure

```
INTEX_II/
├── frontend/                        # React + TypeScript (Vite)
├── backend/
│   └── INTEX_II/
│       └── INTEX_II/
│           ├── Models/              # 17 EF Core entity classes
│           ├── Data/
│           │   ├── AppDbContext.cs  # DbContext + relationship config
│           │   └── DbSeeder.cs      # CSV import logic
│           ├── Program.cs           # App startup, migration, seeding
│           └── appsettings.Development.json
└── pipeline/
    └── data/                        # 17 CSV source files (~8,100 rows)
```

---

### Troubleshooting

**`pg_restore` fails — role does not exist**
Replace `postgres` with your actual PostgreSQL username:
```bash
pg_restore -U YOUR_USERNAME -d intex_ii -F c lighthouse_seed.dump
```

**`pg_restore` fails — database does not exist**
Create it first:
```sql
CREATE DATABASE intex_ii;
```

**App fails to connect**
Check that PostgreSQL is running and the credentials in `appsettings.Development.json` match your local setup.

**Seeder prints "file not found"** *(maintainers only)*
Verify `CsvDataPath` in `appsettings.Development.json` is `../../../pipeline/data`.

**Seeder prints "data already exists" for every table** *(maintainers only)*
The database was already seeded. Set `SeedOnStartup: false`. If you need to re-seed after updating CSVs, use `ForceReseed: true` (see Option C above).

## Deployment
