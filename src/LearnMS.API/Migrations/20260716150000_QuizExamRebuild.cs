using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

/// <inheritdoc />
public class QuizExamRebuild : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "ExpiryMinutes",
            table: "Quiz",
            type: "integer",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<string>(
            name: "SourceTitle",
            table: "Question",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "SourceIndex",
            table: "Question",
            type: "integer",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "QuizAttempt",
            columns: table => new
            {
                QuizId = table.Column<Guid>(type: "uuid", nullable: false),
                StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_QuizAttempt", x => new { x.QuizId, x.StudentId });
                table.ForeignKey(
                    name: "FK_QuizAttempt_Quiz_QuizId",
                    column: x => x.QuizId,
                    principalTable: "Quiz",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_QuizAttempt_Students_StudentId",
                    column: x => x.StudentId,
                    principalTable: "Students",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "QuizAttempt");

        migrationBuilder.DropColumn(name: "ExpiryMinutes", table: "Quiz");
        migrationBuilder.DropColumn(name: "SourceTitle", table: "Question");
        migrationBuilder.DropColumn(name: "SourceIndex", table: "Question");
    }
}
