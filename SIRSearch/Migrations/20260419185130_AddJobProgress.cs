using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIRSearch.Migrations
{
    /// <inheritdoc />
    public partial class AddJobProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PagesProcessed",
                table: "ImportJobs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalPages",
                table: "ImportJobs",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PagesProcessed",
                table: "ImportJobs");

            migrationBuilder.DropColumn(
                name: "TotalPages",
                table: "ImportJobs");
        }
    }
}
