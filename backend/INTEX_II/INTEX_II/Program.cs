using INTEX_II.Data;
using INTEX_II.Services;
using Microsoft.EntityFrameworkCore;
using System.Text;
using INTEX_II.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddScoped<SecurityLogService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174", "https://intex-ii-eta.vercel.app")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 14;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.User.RequireUniqueEmail = true;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders()
.AddSignInManager();

var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
}).AddCookie("Identity.External", options =>
{
    options.ExpireTimeSpan = TimeSpan.FromMinutes(10);
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
})

// Google OAuth
;

var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
{
    builder.Services.AddAuthentication()
        .AddGoogle(options =>
        {
            options.SignInScheme = "Identity.External";
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;
            options.CorrelationCookie.SameSite = SameSiteMode.Lax;
            options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.CorrelationCookie.HttpOnly = true;
        });
}

var msClientId = builder.Configuration["Authentication:Microsoft:ClientId"];
var msClientSecret = builder.Configuration["Authentication:Microsoft:ClientSecret"];
if (!string.IsNullOrWhiteSpace(msClientId) && !string.IsNullOrWhiteSpace(msClientSecret))
{
    builder.Services.AddAuthentication()
        .AddMicrosoftAccount(options =>
        {
            options.SignInScheme = "Identity.External";
            options.ClientId = msClientId;
            options.ClientSecret = msClientSecret;
            options.CorrelationCookie.SameSite = SameSiteMode.Lax;
            options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.CorrelationCookie.HttpOnly = true;
        });
}

var app = builder.Build();

// TO DO: Once everyone runs this, delete it. Just to populate profile picture. 
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE ""AspNetUsers""
        ADD COLUMN IF NOT EXISTS profile_picture_url text NULL;
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE donations
        ADD COLUMN IF NOT EXISTS is_reviewed boolean NOT NULL DEFAULT false;
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS security_logs (
            id            SERIAL PRIMARY KEY,
            timestamp     TIMESTAMP NOT NULL DEFAULT NOW(),
            level         TEXT NOT NULL,
            event_type    TEXT NOT NULL,
            user_email    TEXT,
            ip_address    TEXT,
            details       TEXT
        );
    ");
}

// Seed roles
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var role in new[] { "Admin", "Donor" })
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }
}

if (builder.Configuration.GetValue<bool>("DataSeeding:SeedOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var csvPath = builder.Configuration["DataSeeding:CsvDataPath"]!;
    var forceReseed = builder.Configuration.GetValue<bool>("DataSeeding:ForcedReseed");
    await DbSeeder.SeedAsync(db, csvPath, forceReseed);

    // Test user seeding removed — accounts are created through the app
}

// Always reset sequences on startup to keep them in sync with seeded data.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.ResetSequencesAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHsts();
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("FrontendPolicy");
app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.Lax,
    Secure = CookieSecurePolicy.SameAsRequest,
});
app.UseAuthentication();
app.UseAuthorization();

// Security event logging — capture 401/403 responses after auth pipeline runs
app.Use(async (context, next) =>
{
    await next();
    var ip   = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    var path = context.Request.Path.Value ?? "";
    if (context.Response.StatusCode == 401)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogWarning("Unauthorized (401): {Path} from {IP}", path, ip);
        var secLog = context.RequestServices.GetRequiredService<SecurityLogService>();
        await secLog.WarnAsync("UNAUTHORIZED_401", ipAddress: ip, details: path);
    }
    else if (context.Response.StatusCode == 403)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogWarning("Forbidden (403): {Path} from {IP}", path, ip);
        var secLog = context.RequestServices.GetRequiredService<SecurityLogService>();
        await secLog.WarnAsync("FORBIDDEN_403", ipAddress: ip, details: path);
    }
});

app.MapControllers();

app.Run();
