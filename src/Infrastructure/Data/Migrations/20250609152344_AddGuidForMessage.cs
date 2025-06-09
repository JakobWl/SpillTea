using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FadeChat.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGuidForMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_Guid",
                table: "ChatMessages");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_Guid",
                table: "ChatMessages",
                column: "Guid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_Guid",
                table: "ChatMessages");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_Guid",
                table: "ChatMessages",
                column: "Guid",
                unique: true);
        }
    }
}
