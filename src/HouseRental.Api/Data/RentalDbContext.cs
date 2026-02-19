using Microsoft.EntityFrameworkCore;
using HouseRental.Api.Models;

namespace HouseRental.Api.Data;

public class RentalDbContext : DbContext
{
    public RentalDbContext(DbContextOptions<RentalDbContext> options)
        : base(options) { }

    public DbSet<Rental> Rentals => Set<Rental>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RentalGroup> RentalGroups => Set<RentalGroup>();
    public DbSet<Renter> Renters => Set<Renter>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Rental>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Address).HasMaxLength(500).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50);
            e.Property(x => x.Notes).HasMaxLength(2000);
            e.Property(x => x.Rent).HasPrecision(18, 2);
            e.Property(x => x.Bathrooms).HasPrecision(4, 2);
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UserName).HasMaxLength(256).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            e.HasIndex(x => x.UserName).IsUnique();
        });

        modelBuilder.Entity<RentalGroup>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.HasMany(x => x.Renters).WithOne(r => r.Group).HasForeignKey(r => r.GroupId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Renter>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(256).IsRequired();
            e.Property(x => x.PhoneNumber).HasMaxLength(50);
            e.Property(x => x.RentPrice).HasPrecision(18, 2);
            e.HasMany(x => x.Payments).WithOne(p => p.Renter).HasForeignKey(p => p.RenterId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Payment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasMaxLength(50).IsRequired();
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.RenterId, x.Month, x.Year, x.Type }).IsUnique();
        });
    }
}
