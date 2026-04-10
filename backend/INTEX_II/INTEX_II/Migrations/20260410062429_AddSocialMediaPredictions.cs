using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace INTEX_II.Migrations
{
    /// <inheritdoc />
    public partial class AddSocialMediaPredictions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "social_media_predictions",
                columns: table => new
                {
                    post_id = table.Column<int>(type: "integer", nullable: false),
                    predicted_engagement_tier = table.Column<string>(type: "text", nullable: true),
                    prob_engagement_low = table.Column<double>(type: "double precision", nullable: true),
                    prob_engagement_medium = table.Column<double>(type: "double precision", nullable: true),
                    prob_engagement_high = table.Column<double>(type: "double precision", nullable: true),
                    predicted_has_donations = table.Column<int>(type: "integer", nullable: true),
                    prob_has_donations = table.Column<double>(type: "double precision", nullable: false),
                    donation_tier = table.Column<string>(type: "text", nullable: true),
                    prediction_ts = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_social_media_predictions", x => x.post_id);
                    table.ForeignKey(
                        name: "fk_social_media_predictions_social_media_posts_post_id",
                        column: x => x.post_id,
                        principalTable: "social_media_posts",
                        principalColumn: "post_id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "social_media_predictions");
        }
    }
}
