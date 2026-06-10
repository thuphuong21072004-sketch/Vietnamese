using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionTypeAndSpecialAnswers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "QuestionType",
                table: "Questions",
                type: "nvarchar(50)",
                nullable: false,
                defaultValue: "MULTIPLE_CHOICE");

            migrationBuilder.CreateTable(
                name: "UserSpecialAnswers",
                columns: table => new
                {
                    UserSpecialAnswerId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserQuizId = table.Column<int>(type: "int", nullable: false),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    WrittenText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SpeakScore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    Score = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSpecialAnswers", x => x.UserSpecialAnswerId);
                    table.ForeignKey(
                        name: "FK_UserSpecialAnswers_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserSpecialAnswers_UserQuiz_UserQuizId",
                        column: x => x.UserQuizId,
                        principalTable: "UserQuiz",
                        principalColumn: "UserQuizId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserSpecialAnswers_QuestionId",
                table: "UserSpecialAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSpecialAnswers_UserQuizId",
                table: "UserSpecialAnswers",
                column: "UserQuizId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "UserSpecialAnswers");

            migrationBuilder.DropColumn(
                name: "QuestionType",
                table: "Questions");
        }
    }
}
