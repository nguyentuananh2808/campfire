using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Campfire.Modules.Games.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ExpandCaroBoard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_CaroGames_Board",
                schema: "games",
                table: "CaroGames");

            migrationBuilder.AlterColumn<string>(
                name: "Board",
                schema: "games",
                table: "CaroGames",
                type: "character varying(225)",
                maxLength: 225,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character(9)",
                oldFixedLength: true,
                oldMaxLength: 9);

            migrationBuilder.AddColumn<int>(
                name: "BoardSize",
                schema: "games",
                table: "CaroGames",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WinLength",
                schema: "games",
                table: "CaroGames",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE games."CaroGames"
                SET "BoardSize" = 3, "WinLength" = 3
                WHERE "BoardSize" IS NULL OR "WinLength" IS NULL;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "BoardSize",
                schema: "games",
                table: "CaroGames",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "WinLength",
                schema: "games",
                table: "CaroGames",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_CaroGames_Board",
                schema: "games",
                table: "CaroGames",
                sql: "length(\"Board\") = \"BoardSize\" * \"BoardSize\" AND \"Board\" ~ '^[XO-]+$'");

            migrationBuilder.AddCheckConstraint(
                name: "CK_CaroGames_BoardRules",
                schema: "games",
                table: "CaroGames",
                sql: "(\"BoardSize\" = 3 AND \"WinLength\" = 3) OR (\"BoardSize\" = 15 AND \"WinLength\" = 5)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM games."CaroGames"
                        WHERE "BoardSize" <> 3 OR length("Board") <> 9
                    ) THEN
                        RAISE EXCEPTION 'Cannot roll back ExpandCaroBoard while 15x15 games exist.';
                    END IF;
                END $$;
                """);

            migrationBuilder.DropCheckConstraint(
                name: "CK_CaroGames_Board",
                schema: "games",
                table: "CaroGames");

            migrationBuilder.DropCheckConstraint(
                name: "CK_CaroGames_BoardRules",
                schema: "games",
                table: "CaroGames");

            migrationBuilder.DropColumn(
                name: "BoardSize",
                schema: "games",
                table: "CaroGames");

            migrationBuilder.DropColumn(
                name: "WinLength",
                schema: "games",
                table: "CaroGames");

            migrationBuilder.AlterColumn<string>(
                name: "Board",
                schema: "games",
                table: "CaroGames",
                type: "character(9)",
                fixedLength: true,
                maxLength: 9,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(225)",
                oldMaxLength: 225);

            migrationBuilder.AddCheckConstraint(
                name: "CK_CaroGames_Board",
                schema: "games",
                table: "CaroGames",
                sql: "length(\"Board\") = 9 AND \"Board\" ~ '^[XO-]{9}$'");
        }
    }
}
