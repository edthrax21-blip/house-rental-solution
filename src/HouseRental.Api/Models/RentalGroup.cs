namespace HouseRental.Api.Models;

public class RentalGroup
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. "Block A"
    public DateTime CreatedAt { get; set; }
    public List<Renter> Renters { get; set; } = new();
}
