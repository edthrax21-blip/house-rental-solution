using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HouseRental.Api.Data;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace HouseRental.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WhatsAppController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ILogger<WhatsAppController> _logger;
    private readonly RentalDbContext _db;

    public WhatsAppController(IConfiguration config, ILogger<WhatsAppController> logger, RentalDbContext db)
    {
        _config = config;
        _logger = logger;
        _db = db;
    }

    [HttpPost("send-receipt")]
    public async Task<IActionResult> SendReceipt([FromBody] SendReceiptRequest req, CancellationToken ct)
    {
        var sid = _config["Twilio:AccountSid"];
        var token = _config["Twilio:AuthToken"];
        var from = _config["Twilio:WhatsAppFrom"] ?? "whatsapp:+14155238886";

        if (string.IsNullOrWhiteSpace(sid) || string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "Twilio is not configured. Set AccountSid and AuthToken in appsettings." });

        if (string.IsNullOrWhiteSpace(req.PhoneNumber))
            return BadRequest(new { message = "Renter phone number is required." });

        var toNumber = NormalizePhone(req.PhoneNumber);
        if (string.IsNullOrEmpty(toNumber))
            return BadRequest(new { message = "Invalid phone number format." });

        TwilioClient.Init(sid, token);

        try
        {
            var messageOptions = new CreateMessageOptions(new PhoneNumber($"whatsapp:{toNumber}"))
            {
                From = new PhoneNumber(from),
                Body = req.Message,
            };

            var message = await MessageResource.CreateAsync(messageOptions);

            _logger.LogInformation("WhatsApp sent to {To}, SID: {Sid}, Status: {Status}", toNumber, message.Sid, message.Status);

            // Record timestamp on the rent payment record
            if (req.RenterId.HasValue && req.Month > 0 && req.Year > 0)
            {
                var rentPayment = await _db.Payments.FirstOrDefaultAsync(
                    p => p.RenterId == req.RenterId.Value && p.Month == req.Month && p.Year == req.Year && p.Type == "rent", ct);
                if (rentPayment != null)
                {
                    rentPayment.WhatsAppSentAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync(ct);
                }
            }

            return Ok(new { sid = message.Sid, status = message.Status.ToString(), whatsAppSentAt = DateTime.UtcNow });
        }
        catch (Twilio.Exceptions.ApiException ex)
        {
            _logger.LogError(ex, "Twilio API error sending to {To}", toNumber);
            return StatusCode(502, new { message = $"Twilio error: {ex.Message}" });
        }
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        var sid = _config["Twilio:AccountSid"];
        var token = _config["Twilio:AuthToken"];
        var configured = !string.IsNullOrWhiteSpace(sid) && !string.IsNullOrWhiteSpace(token);
        return Ok(new { configured });
    }

    private static string? NormalizePhone(string phone)
    {
        var digits = new string(phone.Where(c => char.IsDigit(c) || c == '+').ToArray());
        if (!digits.StartsWith('+')) digits = "+" + digits;
        return digits.Length >= 10 ? digits : null;
    }
}

public record SendReceiptRequest(string PhoneNumber, string Message, Guid? RenterId = null, int Month = 0, int Year = 0);
