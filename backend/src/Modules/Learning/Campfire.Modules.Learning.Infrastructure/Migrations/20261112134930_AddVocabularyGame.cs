using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Campfire.Modules.Learning.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVocabularyGame : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_vocabulary_game_progress",
                schema: "learning",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    BestScore = table.Column<int>(type: "integer", nullable: false),
                    BestAccuracy = table.Column<int>(type: "integer", nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    CompletedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_vocabulary_game_progress", x => new { x.UserId, x.Level });
                    table.CheckConstraint("CK_user_vocabulary_game_progress_Attempts", "\"Attempts\" >= 0");
                    table.CheckConstraint("CK_user_vocabulary_game_progress_BestAccuracy", "\"BestAccuracy\" BETWEEN 0 AND 100");
                    table.CheckConstraint("CK_user_vocabulary_game_progress_BestScore", "\"BestScore\" >= 0");
                    table.CheckConstraint("CK_user_vocabulary_game_progress_Level", "\"Level\" BETWEEN 1 AND 10");
                });

            migrationBuilder.CreateTable(
                name: "vocabulary_game_words",
                schema: "learning",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    Chinese = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Pinyin = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    MeaningVi = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vocabulary_game_words", x => x.Id);
                    table.CheckConstraint("CK_vocabulary_game_words_Level", "\"Level\" BETWEEN 1 AND 10");
                    table.CheckConstraint("CK_vocabulary_game_words_OrderIndex", "\"OrderIndex\" BETWEEN 1 AND 20");
                });

            migrationBuilder.InsertData(
                schema: "learning",
                table: "vocabulary_game_words",
                columns: new[] { "Id", "Chinese", "Level", "MeaningVi", "OrderIndex", "Pinyin" },
                values: new object[,]
                {
                    { new Guid("b1000000-0000-0000-0000-000000002001"), "你好", 1, "xin chào", 1, "nǐ hǎo" },
                    { new Guid("b1000000-0000-0000-0000-000000002002"), "谢谢", 1, "cảm ơn", 2, "xièxie" },
                    { new Guid("b1000000-0000-0000-0000-000000002003"), "再见", 1, "tạm biệt", 3, "zàijiàn" },
                    { new Guid("b1000000-0000-0000-0000-000000002004"), "是", 1, "là", 4, "shì" },
                    { new Guid("b1000000-0000-0000-0000-000000002005"), "不", 1, "không", 5, "bù" },
                    { new Guid("b1000000-0000-0000-0000-000000002006"), "我", 2, "tôi", 1, "wǒ" },
                    { new Guid("b1000000-0000-0000-0000-000000002007"), "你", 2, "bạn", 2, "nǐ" },
                    { new Guid("b1000000-0000-0000-0000-000000002008"), "他", 2, "anh ấy", 3, "tā" },
                    { new Guid("b1000000-0000-0000-0000-000000002009"), "她", 2, "cô ấy", 4, "tā" },
                    { new Guid("b1000000-0000-0000-0000-000000002010"), "我们", 2, "chúng tôi", 5, "wǒmen" },
                    { new Guid("b1000000-0000-0000-0000-000000002011"), "一", 3, "một", 1, "yī" },
                    { new Guid("b1000000-0000-0000-0000-000000002012"), "二", 3, "hai", 2, "èr" },
                    { new Guid("b1000000-0000-0000-0000-000000002013"), "三", 3, "ba", 3, "sān" },
                    { new Guid("b1000000-0000-0000-0000-000000002014"), "四", 3, "bốn", 4, "sì" },
                    { new Guid("b1000000-0000-0000-0000-000000002015"), "五", 3, "năm", 5, "wǔ" },
                    { new Guid("b1000000-0000-0000-0000-000000002016"), "今天", 4, "hôm nay", 1, "jīntiān" },
                    { new Guid("b1000000-0000-0000-0000-000000002017"), "明天", 4, "ngày mai", 2, "míngtiān" },
                    { new Guid("b1000000-0000-0000-0000-000000002018"), "昨天", 4, "hôm qua", 3, "zuótiān" },
                    { new Guid("b1000000-0000-0000-0000-000000002019"), "现在", 4, "bây giờ", 4, "xiànzài" },
                    { new Guid("b1000000-0000-0000-0000-000000002020"), "时候", 4, "thời gian / lúc", 5, "shíhou" },
                    { new Guid("b1000000-0000-0000-0000-000000002021"), "爸爸", 5, "bố", 1, "bàba" },
                    { new Guid("b1000000-0000-0000-0000-000000002022"), "妈妈", 5, "mẹ", 2, "māma" },
                    { new Guid("b1000000-0000-0000-0000-000000002023"), "哥哥", 5, "anh trai", 3, "gēge" },
                    { new Guid("b1000000-0000-0000-0000-000000002024"), "姐姐", 5, "chị gái", 4, "jiějie" },
                    { new Guid("b1000000-0000-0000-0000-000000002025"), "朋友", 5, "bạn bè", 5, "péngyou" },
                    { new Guid("b1000000-0000-0000-0000-000000002026"), "学校", 6, "trường học", 1, "xuéxiào" },
                    { new Guid("b1000000-0000-0000-0000-000000002027"), "老师", 6, "giáo viên", 2, "lǎoshī" },
                    { new Guid("b1000000-0000-0000-0000-000000002028"), "学生", 6, "học sinh", 3, "xuésheng" },
                    { new Guid("b1000000-0000-0000-0000-000000002029"), "汉语", 6, "tiếng Trung", 4, "hànyǔ" },
                    { new Guid("b1000000-0000-0000-0000-000000002030"), "学习", 6, "học tập", 5, "xuéxí" },
                    { new Guid("b1000000-0000-0000-0000-000000002031"), "苹果", 7, "táo", 1, "píngguǒ" },
                    { new Guid("b1000000-0000-0000-0000-000000002032"), "米饭", 7, "cơm", 2, "mǐfàn" },
                    { new Guid("b1000000-0000-0000-0000-000000002033"), "喝水", 7, "uống nước", 3, "hē shuǐ" },
                    { new Guid("b1000000-0000-0000-0000-000000002034"), "喜欢", 7, "yêu thích", 4, "xǐhuan" },
                    { new Guid("b1000000-0000-0000-0000-000000002035"), "饭店", 7, "nhà hàng", 5, "fàndiàn" },
                    { new Guid("b1000000-0000-0000-0000-000000002036"), "医院", 8, "bệnh viện", 1, "yīyuàn" },
                    { new Guid("b1000000-0000-0000-0000-000000002037"), "商店", 8, "cửa hàng", 2, "shāngdiàn" },
                    { new Guid("b1000000-0000-0000-0000-000000002038"), "火车站", 8, "ga tàu", 3, "huǒchēzhàn" },
                    { new Guid("b1000000-0000-0000-0000-000000002039"), "出租车", 8, "taxi", 4, "chūzūchē" },
                    { new Guid("b1000000-0000-0000-0000-000000002040"), "飞机", 8, "máy bay", 5, "fēijī" },
                    { new Guid("b1000000-0000-0000-0000-000000002041"), "因为", 9, "bởi vì", 1, "yīnwèi" },
                    { new Guid("b1000000-0000-0000-0000-000000002042"), "所以", 9, "cho nên", 2, "suǒyǐ" },
                    { new Guid("b1000000-0000-0000-0000-000000002043"), "但是", 9, "nhưng", 3, "dànshì" },
                    { new Guid("b1000000-0000-0000-0000-000000002044"), "已经", 9, "đã rồi", 4, "yǐjīng" },
                    { new Guid("b1000000-0000-0000-0000-000000002045"), "正在", 9, "đang", 5, "zhèngzài" },
                    { new Guid("b1000000-0000-0000-0000-000000002046"), "环境", 10, "môi trường", 1, "huánjìng" },
                    { new Guid("b1000000-0000-0000-0000-000000002047"), "文化", 10, "văn hóa", 2, "wénhuà" },
                    { new Guid("b1000000-0000-0000-0000-000000002048"), "经验", 10, "kinh nghiệm", 3, "jīngyàn" },
                    { new Guid("b1000000-0000-0000-0000-000000002049"), "机会", 10, "cơ hội", 4, "jīhuì" },
                    { new Guid("b1000000-0000-0000-0000-000000002050"), "解决", 10, "giải quyết", 5, "jiějué" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_vocabulary_game_progress_UserId_CompletedAtUtc",
                schema: "learning",
                table: "user_vocabulary_game_progress",
                columns: new[] { "UserId", "CompletedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_vocabulary_game_words_Level_OrderIndex",
                schema: "learning",
                table: "vocabulary_game_words",
                columns: new[] { "Level", "OrderIndex" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_vocabulary_game_progress",
                schema: "learning");

            migrationBuilder.DropTable(
                name: "vocabulary_game_words",
                schema: "learning");
        }
    }
}
