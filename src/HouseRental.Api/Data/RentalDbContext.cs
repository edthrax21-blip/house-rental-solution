using Microsoft.EntityFrameworkCore;
using HouseRental.Api.Models;

namespace HouseRental.Api.Data;

public class RentalDbContext : DbContext
{
    public RentalDbContext(DbContextOptions<RentalDbContext> options)
        : base(options) { }

    public DbSet<Rental> Rentals => Set<Rental>();
    public DbSet<User> Users => Set<User>();

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
    }
}
