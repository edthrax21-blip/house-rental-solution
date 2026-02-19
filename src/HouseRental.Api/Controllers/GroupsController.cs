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
    private static readonly string[] PaymentTypes = { "rent", "electricity", "water" };

    public GroupsController(RentalDbContext db) => _db = db;

    // ── Group CRUD ─────────────────────────────────────────────

    [HttpGet]
    public async Task<ActionResult<List<GroupDto>>> GetAll(CancellationToken ct)
    {
        var groups = await _db.RentalGroups.Include(g => g.Renters).OrderBy(g => g.Name).ToListAsync(ct);
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
        var group = new RentalGroup { Id = Guid.NewGuid(), Name = req.Name.Trim(), CreatedAt = DateTime.UtcNow };
        _db.RentalGroups.Add(group);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = group.Id }, ToDto(group));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<GroupDto>> Update(Guid id, [FromBody] CreateGroupRequest req, CancellationToken ct)
    {
        var group = await _db.RentalGroups.Include(g => g.Renters).FirstOrDefaultAsync(g => g.Id == id, ct);
        if (group == null) return NotFound();
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { message = "Group name is required." });
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

    // ── Renter CRUD ────────────────────────────────────────────

    [HttpGet("{groupId:guid}/renters")]
    public async Task<ActionResult<List<RenterDto>>> GetRenters(Guid groupId, CancellationToken ct)
    {
        if (!await _db.RentalGroups.AnyAsync(g => g.Id == groupId, ct)) return NotFound();
        var renters = await _db.Renters.Where(r => r.GroupId == groupId).OrderBy(r => r.Name).ToListAsync(ct);
        return Ok(renters.Select(r => new RenterDto(r.Id, r.GroupId, r.Name, r.PhoneNumber, r.RentPrice, r.CreatedAt, r.UpdatedAt)).ToList());
    }

    [HttpPost("{groupId:guid}/renters")]
    public async Task<ActionResult<RenterDto>> AddRenter(Guid groupId, [FromBody] CreateRenterRequest req, CancellationToken ct)
    {
        if (!await _db.RentalGroups.AnyAsync(g => g.Id == groupId, ct)) return NotFound();
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { message = "Renter name is required." });
        var renter = new Renter
        {
            Id = Guid.NewGuid(), GroupId = groupId, Name = req.Name.Trim(),
            PhoneNumber = req.PhoneNumber?.Trim() ?? "", RentPrice = req.RentPrice, CreatedAt = DateTime.UtcNow,
        };
        _db.Renters.Add(renter);
        await _db.SaveChangesAsync(ct);
        return Created($"/api/groups/{groupId}/renters/{renter.Id}",
            new RenterDto(renter.Id, renter.GroupId, renter.Name, renter.PhoneNumber, renter.RentPrice, renter.CreatedAt, renter.UpdatedAt));
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
        return Ok(new RenterDto(renter.Id, renter.GroupId, renter.Name, renter.PhoneNumber, renter.RentPrice, renter.CreatedAt, renter.UpdatedAt));
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

    [HttpGet("{groupId:guid}/payments")]
    public async Task<ActionResult<List<RenterPaymentsDto>>> GetPayments(Guid groupId, [FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        if (!await _db.RentalGroups.AnyAsync(g => g.Id == groupId, ct)) return NotFound();
        var renters = await _db.Renters.Where(r => r.GroupId == groupId).OrderBy(r => r.Name).ToListAsync(ct);
        var renterIds = renters.Select(r => r.Id).ToList();
        var payments = await _db.Payments
            .Where(p => renterIds.Contains(p.RenterId) && p.Month == month && p.Year == year)
            .ToListAsync(ct);

        var lookup = payments.ToLookup(p => p.RenterId);
        var result = renters.Select(r =>
        {
            var renterPayments = lookup[r.Id].ToDictionary(p => p.Type);
            return new RenterPaymentsDto(
                r.Id, r.Name, r.PhoneNumber, r.RentPrice,
                ToPaymentItem(renterPayments, "rent", r.RentPrice),
                ToPaymentItem(renterPayments, "electricity", 0),
                ToPaymentItem(renterPayments, "water", 0)
            );
        }).ToList();
        return Ok(result);
    }

    [HttpPut("{groupId:guid}/renters/{renterId:guid}/payment")]
    public async Task<ActionResult<PaymentDto>> SetPayment(Guid groupId, Guid renterId, [FromBody] SetPaymentRequest req, CancellationToken ct)
    {
        var renter = await _db.Renters.FirstOrDefaultAsync(r => r.Id == renterId && r.GroupId == groupId, ct);
        if (renter == null) return NotFound();
        if (!PaymentTypes.Contains(req.Type))
            return BadRequest(new { message = $"Invalid type. Must be one of: {string.Join(", ", PaymentTypes)}" });

        var payment = await _db.Payments
            .FirstOrDefaultAsync(p => p.RenterId == renterId && p.Month == req.Month && p.Year == req.Year && p.Type == req.Type, ct);

        if (payment == null)
        {
            payment = new Payment
            {
                Id = Guid.NewGuid(), RenterId = renterId, Month = req.Month, Year = req.Year,
                Type = req.Type, Amount = req.Amount, IsPaid = req.IsPaid,
                PaidDate = req.IsPaid ? DateTime.UtcNow : null, CreatedAt = DateTime.UtcNow,
            };
            _db.Payments.Add(payment);
        }
        else
        {
            payment.Amount = req.Amount;
            payment.IsPaid = req.IsPaid;
            payment.PaidDate = req.IsPaid ? DateTime.UtcNow : null;
        }
        await _db.SaveChangesAsync(ct);
        return Ok(new PaymentDto(payment.Id, payment.RenterId, payment.Month, payment.Year, payment.Type, payment.Amount, payment.IsPaid, payment.PaidDate));
    }

    // ── Reports ────────────────────────────────────────────────

    [HttpGet("reports/summary")]
    public async Task<ActionResult<List<BlockReportDto>>> GetReportSummary([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        var groups = await _db.RentalGroups.Include(g => g.Renters).OrderBy(g => g.Name).ToListAsync(ct);
        var allRenterIds = groups.SelectMany(g => g.Renters.Select(r => r.Id)).ToList();
        var payments = await _db.Payments
            .Where(p => allRenterIds.Contains(p.RenterId) && p.Month == month && p.Year == year)
            .ToListAsync(ct);
        var paymentLookup = payments.ToLookup(p => p.RenterId);

        var result = groups.Select(g =>
        {
            var renters = g.Renters;
            var totalRent = renters.Sum(r => r.RentPrice);
            var rentPayments = renters.SelectMany(r => paymentLookup[r.Id]).Where(p => p.Type == "rent").ToList();
            var elecPayments = renters.SelectMany(r => paymentLookup[r.Id]).Where(p => p.Type == "electricity").ToList();
            var waterPayments = renters.SelectMany(r => paymentLookup[r.Id]).Where(p => p.Type == "water").ToList();

            return new BlockReportDto(
                g.Id, g.Name, renters.Count, totalRent,
                new TypeSummaryDto(rentPayments.Count(p => p.IsPaid), rentPayments.Count(p => !p.IsPaid), rentPayments.Where(p => p.IsPaid).Sum(p => p.Amount)),
                new TypeSummaryDto(elecPayments.Count(p => p.IsPaid), elecPayments.Count(p => !p.IsPaid), elecPayments.Where(p => p.IsPaid).Sum(p => p.Amount)),
                new TypeSummaryDto(waterPayments.Count(p => p.IsPaid), waterPayments.Count(p => !p.IsPaid), waterPayments.Where(p => p.IsPaid).Sum(p => p.Amount))
            );
        }).ToList();

        return Ok(result);
    }

    [HttpGet("reports/{groupId:guid}/renters")]
    public async Task<ActionResult<List<RenterReportDto>>> GetRenterReport(Guid groupId, [FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        if (!await _db.RentalGroups.AnyAsync(g => g.Id == groupId, ct)) return NotFound();
        var renters = await _db.Renters.Where(r => r.GroupId == groupId).OrderBy(r => r.Name).ToListAsync(ct);
        var renterIds = renters.Select(r => r.Id).ToList();
        var payments = await _db.Payments
            .Where(p => renterIds.Contains(p.RenterId) && p.Month == month && p.Year == year)
            .ToListAsync(ct);
        var lookup = payments.ToLookup(p => p.RenterId);

        var result = renters.Select(r =>
        {
            var rp = lookup[r.Id].ToDictionary(p => p.Type);
            return new RenterReportDto(
                r.Id, r.Name, r.RentPrice,
                rp.TryGetValue("rent", out var rent) ? new PaymentStatusDto(rent.Amount, rent.IsPaid, rent.PaidDate) : new PaymentStatusDto(r.RentPrice, false, null),
                rp.TryGetValue("electricity", out var elec) ? new PaymentStatusDto(elec.Amount, elec.IsPaid, elec.PaidDate) : new PaymentStatusDto(0, false, null),
                rp.TryGetValue("water", out var water) ? new PaymentStatusDto(water.Amount, water.IsPaid, water.PaidDate) : new PaymentStatusDto(0, false, null)
            );
        }).ToList();
        return Ok(result);
    }

    // ── DTO helpers ────────────────────────────────────────────

    private static GroupDto ToDto(RentalGroup g) => new(g.Id, g.Name, g.CreatedAt, g.Renters.Count, g.Renters.Sum(r => r.RentPrice));

    private static PaymentItemDto ToPaymentItem(Dictionary<string, Payment> dict, string type, decimal defaultAmount)
    {
        if (dict.TryGetValue(type, out var p))
            return new PaymentItemDto(p.Id, p.Type, p.Amount, p.IsPaid, p.PaidDate);
        return new PaymentItemDto(null, type, defaultAmount, false, null);
    }
}

// ── Request / Response records ─────────────────────────────────
public record CreateGroupRequest(string Name);
public record CreateRenterRequest(string Name, string? PhoneNumber, decimal RentPrice);
public record SetPaymentRequest(int Month, int Year, string Type, decimal Amount, bool IsPaid);

public record GroupDto(Guid Id, string Name, DateTime CreatedAt, int RenterCount, decimal TotalRent);
public record RenterDto(Guid Id, Guid GroupId, string Name, string PhoneNumber, decimal RentPrice, DateTime CreatedAt, DateTime? UpdatedAt);
public record PaymentDto(Guid Id, Guid RenterId, int Month, int Year, string Type, decimal Amount, bool IsPaid, DateTime? PaidDate);
public record PaymentItemDto(Guid? Id, string Type, decimal Amount, bool IsPaid, DateTime? PaidDate);
public record RenterPaymentsDto(Guid RenterId, string Name, string PhoneNumber, decimal RentPrice, PaymentItemDto Rent, PaymentItemDto Electricity, PaymentItemDto Water);

// Reports
public record TypeSummaryDto(int Paid, int Unpaid, decimal CollectedAmount);
public record BlockReportDto(Guid GroupId, string GroupName, int RenterCount, decimal TotalRent, TypeSummaryDto Rent, TypeSummaryDto Electricity, TypeSummaryDto Water);
public record RenterReportDto(Guid RenterId, string Name, decimal RentPrice, PaymentStatusDto Rent, PaymentStatusDto Electricity, PaymentStatusDto Water);
public record PaymentStatusDto(decimal Amount, bool IsPaid, DateTime? PaidDate);
