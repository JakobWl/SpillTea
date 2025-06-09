using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FadeChat.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageGuid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Guid",
                table: "ChatMessages",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_Guid",
                table: "ChatMessages",
                column: "Guid",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_Guid",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "Guid",
                table: "ChatMessages");
        }
    }
}
