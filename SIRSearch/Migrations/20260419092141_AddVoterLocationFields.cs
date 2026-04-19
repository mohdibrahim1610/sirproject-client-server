using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIRSearch.Migrations
{
    /// <inheritdoc />
    public partial class AddVoterLocationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Mandal",
                table: "Voters",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PinCode",
                table: "Voters",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PoliceStation",
                table: "Voters",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PollingStation",
                table: "Voters",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PostOffice",
                table: "Voters",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RevenueDivision",
                table: "Voters",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Section",
                table: "Voters",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Mandal",
                table: "Voters");

            migrationBuilder.DropColumn(
                name: "PinCode",
                table: "Voters");

            migrationBuilder.DropColumn(
                name: "PoliceStation",
                table: "Voters");

            migrationBuilder.DropColumn(
                name: "PollingStation",
                table: "Voters");

            migrationBuilder.DropColumn(
                name: "PostOffice",
                table: "Voters");

            migrationBuilder.DropColumn(
                name: "RevenueDivision",
                table: "Voters");

            migrationBuilder.DropColumn(
                name: "Section",
                table: "Voters");
        }
    }
}
