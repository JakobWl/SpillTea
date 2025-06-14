using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpillTea.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLastMessageSenderToChat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LastMessageSenderId",
                table: "Chats",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastMessageSenderId",
                table: "Chats");
        }
    }
}
