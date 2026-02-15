using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HouseRental.Api.Data;
using HouseRental.Api.Models;

namespace HouseRental.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class GroupsController : ControllerBase
{
    private readonly RentalDbContext _db;

    public GroupsController(RentalDbContext db) => _db = db;

    // ── Group CRUD ─────────────────────────────────────────────

    [HttpGet]
    public async Task<ActionResult<List<GroupDto>>> GetAll(CancellationToken ct)
    {
        var groups = await _db.RentalGroups
            .Include(g => g.Renters)
            .OrderBy(g => g.Name)
            .ToListAsync(ct);

        return Ok(groups.Select(ToDto).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GroupDto>> GetById(Guid id, CancellationToken ct)
    {
        var group = await _db.RentalGroups.Include(g => g.Renters).FirstOrDefaultAsync(g => g.Id == id, ct);
        if (group == null) return NotFound();
        return Ok(ToDto(group));
    }

    [HttpPost]
    public async Task<ActionResult<GroupDto>> Create([FromBody] CreateGroupRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Group name is required." });

        var group = new RentalGroup
        {
            Id = Guid.NewGuid(),
            Name = req.Name.Trim(),
            CreatedAt = DateTime.UtcNow,
        };
        _db.RentalGroups.Add(group);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = group.Id }, ToDto(group));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<GroupDto>> Update(Guid id, [FromBody] CreateGroupRequest req, CancellationToken ct)
    {
        var group = await _db.RentalGroups.Include(g => g.Renters).FirstOrDefaultAsync(g => g.Id == id, ct);
        if (group == null) return NotFound();
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Group name is required." });

        group.Name = req.Name.Trim();
        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(group));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var group = await _db.RentalGroups.FindAsync(new object[] { id }, ct);
        if (group == null) return NotFound();
        _db.RentalGroups.Remove(group);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Monthly summary ────────────────────────────────────────

    [HttpGet("{id:guid}/summary")]
    public async Task<ActionResult<GroupSummaryDto>> GetSummary(Guid id, [FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        var group = await _db.RentalGroups.Include(g => g.Renters).FirstOrDefaultAsync(g => g.Id == id, ct);
        if (group == null) return NotFound();

        var renterIds = group.Renters.Select(r => r.Id).ToList();
        var payments = await _db.Payments
            .Where(p => renterIds.Contains(p.RenterId) && p.Month == month && p.Year == year)
            .ToListAsync(ct);

        var totalRent = group.Renters.Sum(r => r.RentPrice);
        var paidRenterIds = payments.Where(p => p.IsPaid).Select(p => p.RenterId).ToHashSet();
        var paidAmount = group.Renters.Where(r => paidRenterIds.Contains(r.Id)).Sum(r => r.RentPrice);

        return Ok(new GroupSummaryDto(
            group.Id,
            group.Name,
            month,
            year,
            group.Renters.Count,
            totalRent,
            paidRenterIds.Count,
            paidAmount,
            group.Renters.Count - paidRenterIds.Count,
            totalRent - paidAmount
        ));
    }

    // ── Renter CRUD ────────────────────────────────────────────

    [HttpGet("{groupId:guid}/renters")]
    public async Task<ActionResult<List<RenterDto>>> GetRenters(Guid groupId, [FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        if (!await _db.RentalGroups.AnyAsync(g => g.Id == groupId, ct)) return NotFound();
        var renters = await _db.Renters.Where(r => r.GroupId == groupId).OrderBy(r => r.Name).ToListAsync(ct);
        var renterIds = renters.Select(r => r.Id).ToList();

        var payments = await _db.Payments
            .Where(p => renterIds.Contains(p.RenterId) && p.Month == month && p.Year == year)
            .ToDictionaryAsync(p => p.RenterId, ct);

        return Ok(renters.Select(r =>
        {
            payments.TryGetValue(r.Id, out var payment);
            return ToRenterDto(r, payment);
        }).ToList());
    }

    [HttpPost("{groupId:guid}/renters")]
    public async Task<ActionResult<RenterDto>> AddRenter(Guid groupId, [FromBody] CreateRenterRequest req, CancellationToken ct)
    {
        if (!await _db.RentalGroups.AnyAsync(g => g.Id == groupId, ct)) return NotFound();
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Renter name is required." });

        var renter = new Renter
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            Name = req.Name.Trim(),
            PhoneNumber = req.PhoneNumber?.Trim() ?? "",
            RentPrice = req.RentPrice,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Renters.Add(renter);
        await _db.SaveChangesAsync(ct);
        return Created($"/api/groups/{groupId}/renters/{renter.Id}", ToRenterDto(renter, null));
    }

    [HttpPut("{groupId:guid}/renters/{renterId:guid}")]
    public async Task<ActionResult<RenterDto>> UpdateRenter(Guid groupId, Guid renterId, [FromBody] CreateRenterRequest req, CancellationToken ct)
    {
        var renter = await _db.Renters.FirstOrDefaultAsync(r => r.Id == renterId && r.GroupId == groupId, ct);
        if (renter == null) return NotFound();

        renter.Name = req.Name?.Trim() ?? renter.Name;
        renter.PhoneNumber = req.PhoneNumber?.Trim() ?? renter.PhoneNumber;
        renter.RentPrice = req.RentPrice;
        renter.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(ToRenterDto(renter, null));
    }

    [HttpDelete("{groupId:guid}/renters/{renterId:guid}")]
    public async Task<IActionResult> DeleteRenter(Guid groupId, Guid renterId, CancellationToken ct)
    {
        var renter = await _db.Renters.FirstOrDefaultAsync(r => r.Id == renterId && r.GroupId == groupId, ct);
        if (renter == null) return NotFound();
        _db.Renters.Remove(renter);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Payment endpoints ──────────────────────────────────────

    [HttpPut("{groupId:guid}/renters/{renterId:guid}/payment")]
    public async Task<ActionResult<PaymentDto>> SetPayment(Guid groupId, Guid renterId, [FromBody] SetPaymentRequest req, CancellationToken ct)
    {
        var renter = await _db.Renters.FirstOrDefaultAsync(r => r.Id == renterId && r.GroupId == groupId, ct);
        if (renter == null) return NotFound();

        var payment = await _db.Payments
            .FirstOrDefaultAsync(p => p.RenterId == renterId && p.Month == req.Month && p.Year == req.Year, ct);

        if (payment == null)
        {
            payment = new Payment
            {
                Id = Guid.NewGuid(),
                RenterId = renterId,
                Month = req.Month,
                Year = req.Year,
                IsPaid = req.IsPaid,
                PaidDate = req.IsPaid ? DateTime.UtcNow : null,
                CreatedAt = DateTime.UtcNow,
            };
            _db.Payments.Add(payment);
        }
        else
        {
            payment.IsPaid = req.IsPaid;
            payment.PaidDate = req.IsPaid ? DateTime.UtcNow : null;
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new PaymentDto(payment.Id, payment.RenterId, payment.Month, payment.Year, payment.IsPaid, payment.PaidDate));
    }

    // Get all payment records for a group (for audit: returns all months that have at least one record)
    [HttpGet("{groupId:guid}/payments")]
    public async Task<ActionResult<List<MonthlyRecordDto>>> GetPaymentRecords(Guid groupId, CancellationToken ct)
    {
        if (!await _db.RentalGroups.AnyAsync(g => g.Id == groupId, ct)) return NotFound();

        var renterIds = await _db.Renters.Where(r => r.GroupId == groupId).Select(r => r.Id).ToListAsync(ct);
        var payments = await _db.Payments
            .Where(p => renterIds.Contains(p.RenterId))
            .ToListAsync(ct);

        var grouped = payments
            .GroupBy(p => new { p.Year, p.Month })
            .OrderByDescending(g => g.Key.Year).ThenByDescending(g => g.Key.Month)
            .Select(g => new MonthlyRecordDto(g.Key.Month, g.Key.Year, g.Count(p => p.IsPaid), g.Count(p => !p.IsPaid)))
            .ToList();

        return Ok(grouped);
    }

    // ── DTO helpers ────────────────────────────────────────────

    private static GroupDto ToDto(RentalGroup g) => new(g.Id, g.Name, g.CreatedAt, g.Renters.Count,
        g.Renters.Sum(r => r.RentPrice));

    private static RenterDto ToRenterDto(Renter r, Payment? payment) => new(
        r.Id, r.GroupId, r.Name, r.PhoneNumber, r.RentPrice, r.CreatedAt, r.UpdatedAt,
        payment != null ? new PaymentDto(payment.Id, payment.RenterId, payment.Month, payment.Year, payment.IsPaid, payment.PaidDate) : null
    );
}

// ── Request / Response records ─────────────────────────────────
public record CreateGroupRequest(string Name);
public record CreateRenterRequest(string Name, string? PhoneNumber, decimal RentPrice);
public record SetPaymentRequest(int Month, int Year, bool IsPaid);

public record GroupDto(Guid Id, string Name, DateTime CreatedAt, int RenterCount, decimal TotalRent);
public record RenterDto(Guid Id, Guid GroupId, string Name, string PhoneNumber, decimal RentPrice, DateTime CreatedAt, DateTime? UpdatedAt, PaymentDto? Payment);
public record PaymentDto(Guid Id, Guid RenterId, int Month, int Year, bool IsPaid, DateTime? PaidDate);
public record GroupSummaryDto(Guid GroupId, string GroupName, int Month, int Year, int TotalRenters, decimal TotalRentPrice, int PaidRenters, decimal TotalPaidAmount, int UnpaidRenters, decimal TotalUnpaidAmount);
public record MonthlyRecordDto(int Month, int Year, int PaidCount, int UnpaidCount);
