using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using HouseRental.Api.Data;
using HouseRental.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "House Rental API",
        Version = "v1",
        Description = "REST API for managing house rental listings. Use POST /api/auth/login to get a JWT, then Authorize with Bearer &lt;token&gt;.",
    });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Description = "JWT: enter 'Bearer ' + your token",
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" },
            },
            Array.Empty<string>()
        },
    });
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? "YourSecretKeyForSigningTokens_MustBeLongEnough_32CharsMin";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "HouseRental.Api",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "HouseRental.Client",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });

builder.Services.AddDbContext<RentalDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:5173" })
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

// Log which database we're using (verify in SSMS / Azure Data Studio that you're opening this DB)
var connStr = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(connStr))
{
    var server = "?";
    var database = "?";
    foreach (var part in connStr.Split(';', StringSplitOptions.RemoveEmptyEntries))
    {
        var idx = part.Trim().IndexOf('=');
        if (idx <= 0) continue;
        var key = part.Trim()[..idx].Trim();
        var value = part.Trim()[(idx + 1)..].Trim();
        if (key.Equals("Server", StringComparison.OrdinalIgnoreCase)) server = value;
        if (key.Equals("Database", StringComparison.OrdinalIgnoreCase)) database = value;
    }
    app.Logger.LogInformation("Using database: Server={Server}, Database={Database}. Rentals and users are saved here.", server, database);
}

// Migrate and ensure tables exist (fixes "Invalid object name 'Users'" if migrations were out of sync)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RentalDbContext>();
    db.Database.Migrate();

    // Ensure Rentals table exists (SQL Server) in case migration history was out of sync
    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'dbo.Rentals', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Rentals] (
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [Address] NVARCHAR(500) NOT NULL,
        [Bedrooms] INT NOT NULL,
        [Bathrooms] DECIMAL(4,2) NOT NULL,
        [Rent] DECIMAL(18,2) NOT NULL,
        [Status] NVARCHAR(50) NULL,
        [Notes] NVARCHAR(2000) NULL,
        [CreatedAt] DATETIME2(7) NOT NULL,
        [UpdatedAt] DATETIME2(7) NULL,
        CONSTRAINT [PK_Rentals] PRIMARY KEY CLUSTERED ([Id])
    );
END");
        app.Logger.LogInformation("Rentals table ensured.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to ensure Rentals table. CRUD may not work until the table exists.");
    }

    // Ensure Users table exists (SQL Server) in case migration history was out of sync
    await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Users] (
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [UserName] NVARCHAR(256) NOT NULL,
        [PasswordHash] NVARCHAR(500) NOT NULL,
        [CreatedAt] DATETIME2(7) NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([Id])
    );
    CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_UserName] ON [dbo].[Users] ([UserName] ASC);
END");

    // Ensure RentalGroups table exists
    await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'dbo.RentalGroups', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[RentalGroups] (
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [CreatedAt] DATETIME2(7) NOT NULL,
        CONSTRAINT [PK_RentalGroups] PRIMARY KEY CLUSTERED ([Id])
    );
END");

    // Ensure Renters table exists
    await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'dbo.Renters', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Renters] (
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [GroupId] UNIQUEIDENTIFIER NOT NULL,
        [Name] NVARCHAR(256) NOT NULL,
        [PhoneNumber] NVARCHAR(50) NULL,
        [RentPrice] DECIMAL(18,2) NOT NULL,
        [CreatedAt] DATETIME2(7) NOT NULL,
        [UpdatedAt] DATETIME2(7) NULL,
        CONSTRAINT [PK_Renters] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Renters_RentalGroups] FOREIGN KEY ([GroupId]) REFERENCES [dbo].[RentalGroups]([Id]) ON DELETE CASCADE
    );
END");

    // Drop legacy IsPaid column from Renters if it exists (moved to Payments table)
    await db.Database.ExecuteSqlRawAsync(@"
IF COL_LENGTH('dbo.Renters', 'IsPaid') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Renters] DROP COLUMN [IsPaid];
END");

    // Ensure Payments table exists with Type and Amount columns
    await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'dbo.Payments', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Payments] (
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [RenterId] UNIQUEIDENTIFIER NOT NULL,
        [Month] INT NOT NULL,
        [Year] INT NOT NULL,
        [Type] NVARCHAR(50) NOT NULL DEFAULT 'rent',
        [Amount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [IsPaid] BIT NOT NULL DEFAULT 0,
        [PaidDate] DATETIME2(7) NULL,
        [CreatedAt] DATETIME2(7) NOT NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Payments_Renters] FOREIGN KEY ([RenterId]) REFERENCES [dbo].[Renters]([Id]) ON DELETE CASCADE
    );
    CREATE UNIQUE NONCLUSTERED INDEX [IX_Payments_RenterId_Month_Year_Type]
        ON [dbo].[Payments] ([RenterId], [Month], [Year], [Type]);
END");

    // Add Type column if missing (upgrade from old schema)
    await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'dbo.Payments', N'U') IS NOT NULL AND COL_LENGTH('dbo.Payments', 'Type') IS NULL
BEGIN
    ALTER TABLE [dbo].[Payments] ADD [Type] NVARCHAR(50) NOT NULL DEFAULT 'rent';
END");

    // Add Amount column if missing (upgrade from old schema)
    await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'dbo.Payments', N'U') IS NOT NULL AND COL_LENGTH('dbo.Payments', 'Amount') IS NULL
BEGIN
    ALTER TABLE [dbo].[Payments] ADD [Amount] DECIMAL(18,2) NOT NULL DEFAULT 0;
END");

    // Update unique index to include Type (drop old, create new)
    await db.Database.ExecuteSqlRawAsync(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payments_RenterId_Month_Year' AND object_id = OBJECT_ID('dbo.Payments'))
BEGIN
    DROP INDEX [IX_Payments_RenterId_Month_Year] ON [dbo].[Payments];
END
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payments_RenterId_Month_Year_Type' AND object_id = OBJECT_ID('dbo.Payments'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [IX_Payments_RenterId_Month_Year_Type]
        ON [dbo].[Payments] ([RenterId], [Month], [Year], [Type]);
END");

    // Add WhatsAppSentAt column if missing
    await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'dbo.Payments', N'U') IS NOT NULL AND COL_LENGTH('dbo.Payments', 'WhatsAppSentAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[Payments] ADD [WhatsAppSentAt] DATETIME2(7) NULL;
END");

    // Seed admin user via raw SQL so it always runs when admin is missing (avoids DbContext tracking issues)
    var adminHash = BCrypt.Net.BCrypt.HashPassword("admin123");
    await db.Database.ExecuteSqlRawAsync(
        "IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [UserName] = N'admin') " +
        "INSERT INTO [dbo].[Users] ([Id], [UserName], [PasswordHash], [CreatedAt]) " +
        "VALUES (NEWID(), N'admin', {0}, SYSUTCDATETIME())",
        adminHash);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "House Rental API v1"));
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
