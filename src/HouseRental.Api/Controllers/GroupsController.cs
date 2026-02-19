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
            var dict = lookup[r.Id].ToDictionary(p => p.Type);
            dict.TryGetValue("rent", out var rentPay);
            dict.TryGetValue("electricity", out var elecPay);
            dict.TryGetValue("water", out var waterPay);

            var rentAmount = rentPay != null && rentPay.Amount > 0 ? rentPay.Amount : r.RentPrice;
            var elecAmount = elecPay?.Amount ?? 0;
            var waterAmount = waterPay?.Amount ?? 0;
            var isPaid = rentPay?.IsPaid ?? false;
            var paidDate = rentPay?.PaidDate;
            var waSentAt = rentPay?.WhatsAppSentAt;

            return new RenterPaymentsDto(
                r.Id, r.Name, r.PhoneNumber, r.RentPrice,
                rentAmount, elecAmount, waterAmount,
                rentAmount + elecAmount + waterAmount,
                isPaid, paidDate, waSentAt
            );
        }).ToList();
        return Ok(result);
    }

    /// <summary>Update electricity/water bill amounts for a renter</summary>
    [HttpPut("{groupId:guid}/renters/{renterId:guid}/bills")]
    public async Task<IActionResult> UpdateBills(Guid groupId, Guid renterId, [FromBody] UpdateBillsRequest req, CancellationToken ct)
    {
        var renter = await _db.Renters.FirstOrDefaultAsync(r => r.Id == renterId && r.GroupId == groupId, ct);
        if (renter == null) return NotFound();

        await UpsertPaymentAmount(renterId, req.Month, req.Year, "electricity", req.ElectricityAmount, ct);
        await UpsertPaymentAmount(renterId, req.Month, req.Year, "water", req.WaterAmount, ct);
        await _db.SaveChangesAsync(ct);
        return Ok(new { success = true });
    }

    /// <summary>Toggle paid status for a renter (marks rent/elec/water together)</summary>
    [HttpPut("{groupId:guid}/renters/{renterId:guid}/toggle-paid")]
    public async Task<IActionResult> TogglePaid(Guid groupId, Guid renterId, [FromBody] TogglePaidRequest req, CancellationToken ct)
    {
        var renter = await _db.Renters.FirstOrDefaultAsync(r => r.Id == renterId && r.GroupId == groupId, ct);
        if (renter == null) return NotFound();

        var paidDate = req.IsPaid ? DateTime.UtcNow : (DateTime?)null;

        var rentPay = await UpsertPayment(renterId, req.Month, req.Year, "rent", renter.RentPrice, req.IsPaid, paidDate, ct);
        await SyncPaidStatus(renterId, req.Month, req.Year, "electricity", req.IsPaid, paidDate, ct);
        await SyncPaidStatus(renterId, req.Month, req.Year, "water", req.IsPaid, paidDate, ct);

        await _db.SaveChangesAsync(ct);
        return Ok(new { isPaid = rentPay.IsPaid, paidDate = rentPay.PaidDate });
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
            var totalCollected = rentPayments.Where(p => p.IsPaid).Sum(p => p.Amount)
                + elecPayments.Where(p => p.IsPaid).Sum(p => p.Amount)
                + waterPayments.Where(p => p.IsPaid).Sum(p => p.Amount);

            return new BlockReportDto(
                g.Id, g.Name, renters.Count, totalRent,
                new TypeSummaryDto(rentPayments.Count(p => p.IsPaid), rentPayments.Count(p => !p.IsPaid), rentPayments.Where(p => p.IsPaid).Sum(p => p.Amount)),
                new TypeSummaryDto(elecPayments.Count(p => p.IsPaid), elecPayments.Count(p => !p.IsPaid), elecPayments.Where(p => p.IsPaid).Sum(p => p.Amount)),
                new TypeSummaryDto(waterPayments.Count(p => p.IsPaid), waterPayments.Count(p => !p.IsPaid), waterPayments.Where(p => p.IsPaid).Sum(p => p.Amount)),
                totalCollected
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
            rp.TryGetValue("rent", out var rent);
            rp.TryGetValue("electricity", out var elec);
            rp.TryGetValue("water", out var water);
            var rentAmt = rent != null && rent.Amount > 0 ? rent.Amount : r.RentPrice;
            var elecAmt = elec?.Amount ?? 0;
            var waterAmt = water?.Amount ?? 0;
            return new RenterReportDto(
                r.Id, r.Name, r.RentPrice, rentAmt, elecAmt, waterAmt,
                rentAmt + elecAmt + waterAmt,
                rent?.IsPaid ?? false, rent?.PaidDate
            );
        }).ToList();
        return Ok(result);
    }

    // ── Private helpers ────────────────────────────────────────

    private static GroupDto ToDto(RentalGroup g) => new(g.Id, g.Name, g.CreatedAt, g.Renters.Count, g.Renters.Sum(r => r.RentPrice));

    private async Task UpsertPaymentAmount(Guid renterId, int month, int year, string type, decimal amount, CancellationToken ct)
    {
        var p = await _db.Payments.FirstOrDefaultAsync(x => x.RenterId == renterId && x.Month == month && x.Year == year && x.Type == type, ct);
        if (p == null)
        {
            _db.Payments.Add(new Payment { Id = Guid.NewGuid(), RenterId = renterId, Month = month, Year = year, Type = type, Amount = amount, CreatedAt = DateTime.UtcNow });
        }
        else
        {
            p.Amount = amount;
        }
    }

    private async Task<Payment> UpsertPayment(Guid renterId, int month, int year, string type, decimal amount, bool isPaid, DateTime? paidDate, CancellationToken ct)
    {
        var p = await _db.Payments.FirstOrDefaultAsync(x => x.RenterId == renterId && x.Month == month && x.Year == year && x.Type == type, ct);
        if (p == null)
        {
            p = new Payment { Id = Guid.NewGuid(), RenterId = renterId, Month = month, Year = year, Type = type, Amount = amount, IsPaid = isPaid, PaidDate = paidDate, CreatedAt = DateTime.UtcNow };
            _db.Payments.Add(p);
        }
        else
        {
            p.Amount = amount > 0 ? amount : p.Amount;
            p.IsPaid = isPaid;
            p.PaidDate = paidDate;
        }
        return p;
    }

    private async Task SyncPaidStatus(Guid renterId, int month, int year, string type, bool isPaid, DateTime? paidDate, CancellationToken ct)
    {
        var p = await _db.Payments.FirstOrDefaultAsync(x => x.RenterId == renterId && x.Month == month && x.Year == year && x.Type == type, ct);
        if (p != null) { p.IsPaid = isPaid; p.PaidDate = paidDate; }
    }
}

// ── Request / Response records ─────────────────────────────────
public record CreateGroupRequest(string Name);
public record CreateRenterRequest(string Name, string? PhoneNumber, decimal RentPrice);
public record UpdateBillsRequest(int Month, int Year, decimal ElectricityAmount, decimal WaterAmount);
public record TogglePaidRequest(int Month, int Year, bool IsPaid);

public record GroupDto(Guid Id, string Name, DateTime CreatedAt, int RenterCount, decimal TotalRent);
public record RenterDto(Guid Id, Guid GroupId, string Name, string PhoneNumber, decimal RentPrice, DateTime CreatedAt, DateTime? UpdatedAt);
public record RenterPaymentsDto(Guid RenterId, string Name, string PhoneNumber, decimal RentPrice, decimal RentAmount, decimal ElectricityAmount, decimal WaterAmount, decimal TotalAmount, bool IsPaid, DateTime? PaidDate, DateTime? WhatsAppSentAt);

// Reports
public record TypeSummaryDto(int Paid, int Unpaid, decimal CollectedAmount);
public record BlockReportDto(Guid GroupId, string GroupName, int RenterCount, decimal TotalRent, TypeSummaryDto Rent, TypeSummaryDto Electricity, TypeSummaryDto Water, decimal TotalCollected);
public record RenterReportDto(Guid RenterId, string Name, decimal RentPrice, decimal RentAmount, decimal ElectricityAmount, decimal WaterAmount, decimal TotalAmount, bool IsPaid, DateTime? PaidDate);
