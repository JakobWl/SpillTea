using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpillTea.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class AddGuidForMessage : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // First, add the Guid column if it doesn't exist
        migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ChatMessages' AND COLUMN_NAME = 'Guid')
                BEGIN
                    ALTER TABLE ChatMessages ADD Guid nvarchar(450) NOT NULL DEFAULT ''
                END");

        // Check if index exists before dropping it
        migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ChatMessages_Guid' AND object_id = OBJECT_ID('ChatMessages'))
                BEGIN
                    DROP INDEX IX_ChatMessages_Guid ON ChatMessages
                END");

        migrationBuilder.CreateIndex(
            name: "IX_ChatMessages_Guid",
            table: "ChatMessages",
            column: "Guid");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Check if index exists before dropping it
        migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ChatMessages_Guid' AND object_id = OBJECT_ID('ChatMessages'))
                BEGIN
                    DROP INDEX IX_ChatMessages_Guid ON ChatMessages
                END");

        migrationBuilder.CreateIndex(
            name: "IX_ChatMessages_Guid",
            table: "ChatMessages",
            column: "Guid",
                            unique: true);
    }
}
