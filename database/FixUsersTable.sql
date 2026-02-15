-- Run this against your HouseRentalDb to fix "Invalid object name 'Users'"
-- Use the same server as in your connection string (e.g. (localdb)\mssqllocaldb)

USE [HouseRentalDb];
GO

-- Create Users table if it doesn't exist
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

    PRINT 'Users table created.';
END
ELSE
    PRINT 'Users table already exists.';
GO

-- Tell EF Core this migration was applied (so it won't try to run it again)
IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = N'20250214100000_AddUsers')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250214100000_AddUsers', N'8.0.11');
    PRINT 'Migration history updated.';
END
GO

PRINT 'Done. Restart the API and try Swagger again.';
GO
