using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HouseRental.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReceiptsController : ControllerBase
{
    private static readonly string StorageDir = Path.Combine(AppContext.BaseDirectory, "receipts");
    private readonly IConfiguration _config;

    public ReceiptsController(IConfiguration config) => _config = config;

    [HttpPost("upload")]
    [Authorize]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        if (!file.ContentType.Contains("pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Only PDF files are accepted." });

        Directory.CreateDirectory(StorageDir);

        var id = Guid.NewGuid().ToString("N")[..12];
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext)) ext = ".pdf";
        var storedName = $"{id}{ext}";

        var filePath = Path.Combine(StorageDir, storedName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, ct);
        }

        var publicBase = _config["PublicBaseUrl"]?.TrimEnd('/');
        if (string.IsNullOrEmpty(publicBase))
            publicBase = $"{Request.Scheme}://{Request.Host}";
        var downloadUrl = $"{publicBase}/api/receipts/{id}";

        return Ok(new { id, downloadUrl });
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public IActionResult Download(string id)
    {
        if (string.IsNullOrWhiteSpace(id) || id.Length > 20 || id.Any(c => !char.IsLetterOrDigit(c)))
            return BadRequest();

        var filePath = Path.Combine(StorageDir, $"{id}.pdf");
        if (!System.IO.File.Exists(filePath))
            return NotFound(new { message = "Receipt not found." });

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return File(stream, "application/pdf", $"receipt-{id}.pdf");
    }
}
