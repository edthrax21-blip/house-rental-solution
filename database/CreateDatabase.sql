-- =============================================
-- House Rental Database - SQL Server
-- Run this script to create the database and
-- tables. Matches the EF Core migrations.
-- =============================================

-- Create database (skip if it already exists)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'HouseRentalDb')
BEGIN
    CREATE DATABASE [HouseRentalDb];
END
GO

USE [HouseRentalDb];
GO

-- Drop tables if they exist (optional; comment out to avoid losing data)
-- IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL DROP TABLE [dbo].[Users];
-- IF OBJECT_ID(N'dbo.Rentals', N'U') IS NOT NULL DROP TABLE [dbo].[Rentals];
-- GO

-- Rentals table
IF OBJECT_ID(N'dbo.Rentals', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Rentals] (
        [Id]        UNIQUEIDENTIFIER NOT NULL,
        [Address]   NVARCHAR(500)    NOT NULL,
        [Bedrooms]  INT             NOT NULL,
        [Bathrooms] DECIMAL(4,2)    NOT NULL,
        [Rent]      DECIMAL(18,2)   NOT NULL,
        [Status]    NVARCHAR(50)    NULL,
        [Notes]     NVARCHAR(2000)  NULL,
        [CreatedAt] DATETIME2(7)    NOT NULL,
        [UpdatedAt] DATETIME2(7)   NULL,
        CONSTRAINT [PK_Rentals] PRIMARY KEY CLUSTERED ([Id])
    );
END
GO

-- Users table
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Users] (
        [Id]           UNIQUEIDENTIFIER NOT NULL,
        [UserName]     NVARCHAR(256)    NOT NULL,
        [PasswordHash] NVARCHAR(500)    NOT NULL,
        [CreatedAt]    DATETIME2(7)     NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([Id])
    );

    CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_UserName]
        ON [dbo].[Users] ([UserName] ASC);
END
GO

-- Default user (admin / admin123) is created by the API on first run when no users exist.

PRINT 'HouseRentalDb schema created successfully.';
GO
