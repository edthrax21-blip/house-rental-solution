namespace HouseRental.Api.Models;

public class Renter
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public decimal RentPrice { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public RentalGroup? Group { get; set; }
    public List<Payment> Payments { get; set; } = new();
}
