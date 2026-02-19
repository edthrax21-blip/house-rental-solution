namespace HouseRental.Api.Models;

public class Payment
{
    public Guid Id { get; set; }
    public Guid RenterId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public string Type { get; set; } = "rent"; // rent | electricity | water
    public decimal Amount { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidDate { get; set; }
    public DateTime? WhatsAppSentAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Renter? Renter { get; set; }
}
