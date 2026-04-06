using INTEX_II.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

var app = builder.Build();

// Apply pending migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Optionally seed CSV data on startup (set SeedOnStartup: true in appsettings)
    var seedOnStartup = builder.Configuration.GetValue<bool>("DataSeeding:SeedOnStartup");
    if (seedOnStartup)
    {
        var csvPath = builder.Configuration["DataSeeding:CsvDataPath"] ?? string.Empty;
        if (!Path.IsPathRooted(csvPath))
            csvPath = Path.Combine(app.Environment.ContentRootPath, csvPath);

        await DbSeeder.SeedAsync(db, csvPath);
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.Run();
