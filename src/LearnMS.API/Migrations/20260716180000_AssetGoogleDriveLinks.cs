using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260716180000_AssetGoogleDriveLinks")]
public partial class AssetGoogleDriveLinks : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Url",
            table: "Asset",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "LectureName",
            table: "Asset",
            type: "text",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "Url", table: "Asset");
        migrationBuilder.DropColumn(name: "LectureName", table: "Asset");
    }
}
