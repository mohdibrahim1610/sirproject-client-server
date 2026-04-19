using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIRSearch.Migrations
{
    /// <inheritdoc />
    public partial class AddSerialAndPage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PageNumber",
                table: "Voters",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SerialNumber",
                table: "Voters",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PageNumber",
                table: "Voters");

            migrationBuilder.DropColumn(
                name: "SerialNumber",
                table: "Voters");
        }
    }
}
