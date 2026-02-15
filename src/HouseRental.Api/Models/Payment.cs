namespace HouseRental.Api.Models;

public class Payment
{
    public Guid Id { get; set; }
    public Guid RenterId { get; set; }
    public int Month { get; set; }   // 1-12
    public int Year { get; set; }    // e.g. 2026
    public bool IsPaid { get; set; }
    public DateTime? PaidDate { get; set; }
    public DateTime CreatedAt { get; set; }

    public Renter? Renter { get; set; }
}
