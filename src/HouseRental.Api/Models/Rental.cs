namespace HouseRental.Api.Models;

public class Rental
{
    public Guid Id { get; set; }
    public string Address { get; set; } = string.Empty;
    public int Bedrooms { get; set; }
    public decimal Bathrooms { get; set; }
    public decimal Rent { get; set; }
    public string Status { get; set; } = "available"; // available | occupied | maintenance
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
