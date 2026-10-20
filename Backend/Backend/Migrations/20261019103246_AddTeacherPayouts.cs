using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherPayouts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // StudentTrips.PhoneNumber: DB cũ đã có (migration AddPhoneNumberToStudentTrip không còn trong repo),
            // DB tạo mới từ migrations thì chưa có → chỉ thêm khi thiếu.
            migrationBuilder.Sql(
                "IF OBJECT_ID('dbo.StudentTrips') IS NOT NULL AND COL_LENGTH('dbo.StudentTrips', 'PhoneNumber') IS NULL " +
                "ALTER TABLE [StudentTrips] ADD [PhoneNumber] nvarchar(max) NULL;");

            migrationBuilder.CreateTable(
                name: "TeacherPayouts",
                columns: table => new
                {
                    PayoutId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeacherUserId = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeacherPayouts", x => x.PayoutId);
                    table.ForeignKey(
                        name: "FK_TeacherPayouts_Users_TeacherUserId",
                        column: x => x.TeacherUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeacherPayouts_TeacherUserId",
                table: "TeacherPayouts",
                column: "TeacherUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TeacherPayouts");
        }
    }
}
