using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using INTEX_II.Data;
using INTEX_II.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace INTEX_II.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _config;
    private readonly AppDbContext _db;

    public AuthController(UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager, IConfiguration config, AppDbContext db)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _config = config;
        _db = db;
    }

    // Public registration — always creates a Donor + Supporter record
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var user = new ApplicationUser { UserName = dto.Email, Email = dto.Email, FirstName = dto.FirstName, LastName = dto.LastName };
        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(user, "Donor");
        await EnsureSupporterExists(dto.Email, dto.FirstName, dto.LastName);
        return Ok(new { message = "User registered successfully" });
    }

    // Admin-only — creates another Admin account
    [Authorize(Roles = "Admin")]
    [HttpPost("register-admin")]
    public async Task<IActionResult> RegisterAdmin([FromBody] RegisterDto dto)
    {
        var user = new ApplicationUser { UserName = dto.Email, Email = dto.Email, FirstName = dto.FirstName, LastName = dto.LastName };
        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(user, "Admin");
        return Ok(new { message = "Admin user registered successfully" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return Unauthorized("Invalid credentials");

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded) return Unauthorized("Invalid credentials");

        var token = await GenerateJwtToken(user);
        return Ok(new { token });
    }

    private async Task<string> GenerateJwtToken(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName),
        };
        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(_config.GetValue<int>("Jwt:ExpirationInHours"));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // GET /api/auth/me — returns the current user's profile
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.UserName,
            user.ProfilePictureUrl,
        });
    }

    // PUT /api/auth/me — update name and profile picture
    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMeDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.ProfilePictureUrl = dto.ProfilePictureUrl;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new { user.FirstName, user.LastName, user.ProfilePictureUrl });
    }

    // POST /api/auth/me/change-password — self-service password change
    [Authorize]
    [HttpPost("me/change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new { message = "Password changed successfully." });
    }

    [HttpGet("external-login")]
    public IActionResult ExternalLogin([FromQuery] string provider)
    {
        var redirectUrl = Url.Action(nameof(ExternalCallback), "Auth");
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
        return Challenge(properties, provider);
    }
    
    [HttpGet("external-callback")]
public async Task<IActionResult> ExternalCallback()
{
    var info = await _signInManager.GetExternalLoginInfoAsync();
    var frontendUrl = _config["Frontend:Url"]!;
    if (info == null) return Redirect($"{frontendUrl}/login?error=oauth_failed");

    var email = info.Principal.FindFirstValue(ClaimTypes.Email);
    if (email == null) return Redirect($"{frontendUrl}/login?error=no_email");

    // Find or create the user
    var user = await _userManager.FindByEmailAsync(email);
    if (user == null)
    {
        user = new ApplicationUser
        {
            UserName  = email,
            Email     = email,
            FirstName = info.Principal.FindFirstValue(ClaimTypes.GivenName) ?? "",
            LastName  = info.Principal.FindFirstValue(ClaimTypes.Surname)  ?? "",
        };
        await _userManager.CreateAsync(user);
        await _userManager.AddToRoleAsync(user, "Donor");
    }

    // Link the provider login to the user (idempotent)
    await _userManager.AddLoginAsync(user, info);
    await EnsureSupporterExists(
        email,
        info.Principal.FindFirstValue(ClaimTypes.GivenName) ?? "",
        info.Principal.FindFirstValue(ClaimTypes.Surname) ?? "");

    var token = await GenerateJwtToken(user);
    return Redirect($"{_config["Frontend:Url"]}/oauth-callback?token={token}");
}

private async Task EnsureSupporterExists(string email, string firstName, string lastName)
{
    var existing = await _db.Supporters.FirstOrDefaultAsync(s => s.Email == email);
    if (existing is not null) return;

    var displayName = $"{firstName} {lastName}".Trim();
    if (string.IsNullOrEmpty(displayName)) displayName = email;

    await _db.Database.ExecuteSqlRawAsync(
        "SELECT setval('supporters_supporter_id_seq', GREATEST((SELECT MAX(supporter_id) FROM supporters), nextval('supporters_supporter_id_seq') - 1))");

    _db.Supporters.Add(new Supporter
    {
        Email              = email,
        FirstName          = firstName,
        LastName           = lastName,
        DisplayName        = displayName,
        OrganizationName   = string.Empty,
        SupporterType      = "Monetary Donor",
        RelationshipType   = "Individual",
        Region             = string.Empty,
        Country            = string.Empty,
        Phone              = string.Empty,
        Status             = "Active",
        CreatedAt          = DateTime.UtcNow,
        AcquisitionChannel = "Self-Registration",
    });
    await _db.SaveChangesAsync();
}
}


public record RegisterDto(string Email, string Password, string FirstName, string LastName);
public record LoginDto(string Email, string Password);
public record UpdateMeDto(string FirstName, string LastName, string? ProfilePictureUrl);
public record ChangePasswordDto(string CurrentPassword, string NewPassword);