using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using HouseRental.Api.Data;
using HouseRental.Api.Models;

namespace HouseRental.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly RentalDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(RentalDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    /// <summary>Login with username and password. Returns a JWT token.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
            return Unauthorized(new { message = "Username and password are required." });

        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserName == request.UserName.Trim(), cancellationToken);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password." });

        var token = GenerateJwt(user);
        return Ok(new LoginResponse(
            token,
            user.UserName,
            DateTime.UtcNow.AddMinutes(GetJwtExpiryMinutes())));
    }

    /// <summary>Register a new user (optional; for demo you can also seed a user).</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || request.UserName.Length < 2)
            return BadRequest(new { message = "Username must be at least 2 characters." });
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var userName = request.UserName.Trim();
        var exists = await _db.Users.AnyAsync(u => u.UserName == userName, cancellationToken);
        if (exists)
            return BadRequest(new { message = "Username already taken." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = userName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow,
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Login), new { }, new { userName = user.UserName });
    }

    /// <summary>Check if the database connection and Rentals table are OK (for login page debug).</summary>
    [HttpGet("db-status")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(DbStatusResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DbStatusResponse>> GetDbStatus(CancellationToken cancellationToken)
    {
        var dbOnline = false;
        var rentalsTableOk = false;
        try
        {
            dbOnline = await _db.Database.CanConnectAsync(cancellationToken);
            if (dbOnline)
            {
                _ = await _db.Rentals.AnyAsync(cancellationToken);
                rentalsTableOk = true;
            }
        }
        catch
        {
            /* rentalsTableOk stays false if query fails (e.g. Invalid object name 'Rentals') */
        }
        return Ok(new DbStatusResponse(dbOnline ? "online" : "offline", rentalsTableOk));
    }

    private string GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtSecret()));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiryMinutes = GetJwtExpiryMinutes();

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: GetJwtIssuer(),
            audience: GetJwtAudience(),
            claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GetJwtSecret() =>
        _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not set.");
    private string GetJwtIssuer() => _config["Jwt:Issuer"] ?? "HouseRental.Api";
    private string GetJwtAudience() => _config["Jwt:Audience"] ?? "HouseRental.Client";
    private int GetJwtExpiryMinutes() => int.TryParse(_config["Jwt:ExpiryMinutes"], out var m) ? m : 60;
}

public record LoginRequest(string UserName, string Password);
public record LoginResponse(string Token, string UserName, DateTime ExpiresAt);
public record RegisterRequest(string UserName, string Password);
public record DbStatusResponse(string DbConnection, bool RentalsTableOk = false);
