using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIRSearch.Migrations
{
    /// <inheritdoc />
    public partial class AddConstituencyAndPart : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConstituencyCode",
                table: "Voters",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PartNumber",
                table: "Voters",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConstituencyCode",
                table: "Voters");

            migrationBuilder.DropColumn(
                name: "PartNumber",
                table: "Voters");
        }
    }
}
