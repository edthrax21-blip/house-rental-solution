using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using HouseRental.Api.Data;
using HouseRental.Api.Models;

namespace HouseRental.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class RentalsController : ControllerBase
{
    private readonly RentalDbContext _db;

    public RentalsController(RentalDbContext db)
    {
        _db = db;
    }

    /// <summary>Get all rental listings, optionally filtered by status or search.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Rental>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<IEnumerable<Rental>>> GetRentals(
        [FromQuery] string? status,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _db.Rentals.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(r => r.Status == status.Trim());

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(r =>
                    (r.Address != null && r.Address.ToLower().Contains(term)) ||
                    (r.Notes != null && r.Notes.ToLower().Contains(term)));
            }

            var list = await query.OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt).ToListAsync(cancellationToken);
            return Ok(list);
        }
        catch (SqlException ex) when (ex.Number == 208 || ex.Message.Contains("Invalid object name"))
        {
            return StatusCode(503, new { message = "Rentals table is missing. Restart the API to create it.", detail = ex.Message });
        }
    }

    /// <summary>Get a single rental by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Rental), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Rental>> GetRental(Guid id, CancellationToken cancellationToken)
    {
        var rental = await _db.Rentals.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (rental == null)
            return NotFound();
        return Ok(rental);
    }

    /// <summary>Create a new rental listing.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(Rental), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<Rental>> CreateRental([FromBody] RentalCreateDto dto, CancellationToken cancellationToken)
    {
        if (dto == null)
            return BadRequest(new { message = "Request body is missing." });

        if (string.IsNullOrWhiteSpace(dto.Address))
            return BadRequest(new { message = "Address is required." });

        try
        {
            var rental = new Rental
            {
                Id = Guid.NewGuid(),
                Address = dto.Address.Trim(),
                Bedrooms = dto.Bedrooms,
                Bathrooms = dto.Bathrooms,
                Rent = dto.Rent,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "available" : dto.Status.Trim(),
                Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
                CreatedAt = DateTime.UtcNow,
            };

            await _db.Rentals.AddAsync(rental, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            return CreatedAtAction(nameof(GetRental), new { id = rental.Id }, rental);
        }
        catch (DbUpdateException ex)
        {
            return StatusCode(503, new { message = "Database update failed.", detail = ex.Message });
        }
        catch (SqlException ex) when (ex.Number == 208 || ex.Message.Contains("Invalid object name"))
        {
            return StatusCode(503, new { message = "Rentals table is missing. Restart the API to create it.", detail = ex.Message });
        }
    }

    /// <summary>Update an existing rental listing.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(Rental), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Rental>> UpdateRental(Guid id, [FromBody] RentalUpdateDto dto, CancellationToken cancellationToken)
    {
        var rental = await _db.Rentals.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (rental == null)
            return NotFound();

        rental.Address = dto.Address?.Trim() ?? rental.Address;
        rental.Bedrooms = dto.Bedrooms ?? rental.Bedrooms;
        rental.Bathrooms = dto.Bathrooms ?? rental.Bathrooms;
        rental.Rent = dto.Rent ?? rental.Rent;
        if (dto.Status != null)
            rental.Status = dto.Status.Trim();
        rental.Notes = dto.Notes == null ? rental.Notes : (string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim());
        rental.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(rental);
    }

    /// <summary>Delete a rental listing.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRental(Guid id, CancellationToken cancellationToken)
    {
        var rental = await _db.Rentals.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (rental == null)
            return NotFound();

        _db.Rentals.Remove(rental);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public record RentalCreateDto(string Address, int Bedrooms, decimal Bathrooms, decimal Rent, string? Status = null, string? Notes = null);
public record RentalUpdateDto(string? Address, int? Bedrooms, decimal? Bathrooms, decimal? Rent, string? Status, string? Notes);
