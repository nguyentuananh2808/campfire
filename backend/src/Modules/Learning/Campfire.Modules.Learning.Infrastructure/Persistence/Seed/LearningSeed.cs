using Campfire.Modules.Learning.Domain.Courses;
using Campfire.Modules.Learning.Domain.Games;
using Campfire.Modules.Learning.Domain.Vocabulary;
using Microsoft.EntityFrameworkCore;

namespace Campfire.Modules.Learning.Infrastructure.Persistence.Seed;

internal static class LearningSeed
{
    internal static readonly Guid CourseId = Guid.Parse("a1000000-0000-0000-0000-000000000001");
    internal static readonly Guid UnitId = Guid.Parse("a1000000-0000-0000-0000-000000000101");
    internal static readonly Guid Day1Id = Guid.Parse("a1000000-0000-0000-0000-000000001001");
    internal static readonly Guid Day2Id = Guid.Parse("a1000000-0000-0000-0000-000000001002");

    internal static void Apply(ModelBuilder m)
    {
        m.Entity<Course>().HasData(new Course(CourseId, "hsk1", "HSK 1 – Tiếng Trung cơ bản", "Lộ trình nền tảng cho người mới bắt đầu.", 1, "1.0"));
        m.Entity<CourseUnit>().HasData(new CourseUnit(UnitId, CourseId, 1, "Unit 01 — Làm quen tiếng Trung"));
        m.Entity<LearningDay>().HasData(
            new LearningDay(Day1Id, CourseId, UnitId, 1, "Xin chào", "你好！", "Chào hỏi, hỏi thăm và nói lời cảm ơn.", 18, 100),
            new LearningDay(Day2Id, CourseId, UnitId, 2, "Tôi tên là…", "我叫…", "Giới thiệu tên và quốc tịch.", 20, 100));
        m.Entity<LessonActivity>().HasData(Activities());
        m.Entity<Vocabulary>().HasData(VocabularyItems());
        m.Entity<VocabularyRelation>().HasData(Relations());
        m.Entity<VocabularyGameWord>().HasData(GameWords());
    }

    private static LessonActivity[] Activities() =>
    [
        new(Guid.Parse("a1000000-0000-0000-0000-000000010001"), Day1Id, "VOCABULARY", "Từ vựng chào hỏi", 1, true, """{"items":[{"chinese":"你好","pinyin":"nǐ hǎo","meaningVi":"xin chào","exampleChinese":"你好！","examplePinyin":"Nǐ hǎo!","translationVi":"Xin chào!"},{"chinese":"谢谢","pinyin":"xièxie","meaningVi":"cảm ơn","exampleChinese":"谢谢你。","examplePinyin":"Xièxie nǐ.","translationVi":"Cảm ơn bạn."},{"chinese":"再见","pinyin":"zàijiàn","meaningVi":"tạm biệt","exampleChinese":"老师，再见！","examplePinyin":"Lǎoshī, zàijiàn!","translationVi":"Tạm biệt thầy/cô!"}]}"""),
        new(Guid.Parse("a1000000-0000-0000-0000-000000010002"), Day1Id, "SENTENCE", "Mẫu câu cơ bản", 2, true, """{"items":[{"chinese":"你好吗？","pinyin":"Nǐ hǎo ma?","translationVi":"Bạn khỏe không?"},{"chinese":"我很好。","pinyin":"Wǒ hěn hǎo.","translationVi":"Tôi rất khỏe."}]}"""),
        new(Guid.Parse("a1000000-0000-0000-0000-000000010003"), Day1Id, "GRAMMAR", "Cấu trúc 很 và 吗", 3, true, """{"name":"A + 很 + adjective","explanationVi":"Dùng 很 trước tính từ; thêm 吗 cuối câu để tạo câu hỏi có/không.","examples":["我很好。","你好吗？"]}"""),
        new(Guid.Parse("a1000000-0000-0000-0000-000000010004"), Day1Id, "EXERCISE", "Luyện tập ngày 1", 4, true, """{"questions":[{"id":"q1","type":"MULTIPLE_CHOICE","question":"你好 có nghĩa là gì?","options":["Xin chào","Cảm ơn","Tạm biệt"],"correctAnswer":"Xin chào"},{"id":"q2","type":"PINYIN","question":"Pinyin đúng của 谢谢 là gì?","options":["xièxie","zàijiàn","nǐhǎo"],"correctAnswer":"xièxie"},{"id":"q3","type":"SENTENCE_ORDER","question":"Sắp xếp: [很] [我] [好]","options":[],"correctAnswer":"我很好"}]}"""),
        new(Guid.Parse("a1000000-0000-0000-0000-000000020001"), Day2Id, "VOCABULARY", "Tên và quốc tịch", 1, true, """{"items":[{"chinese":"叫","pinyin":"jiào","meaningVi":"tên là / gọi"},{"chinese":"名字","pinyin":"míngzi","meaningVi":"tên"},{"chinese":"越南","pinyin":"Yuènán","meaningVi":"Việt Nam"}]}"""),
        new(Guid.Parse("a1000000-0000-0000-0000-000000020002"), Day2Id, "SENTENCE", "Tự giới thiệu", 2, true, """{"items":[{"chinese":"我叫小明。","pinyin":"Wǒ jiào Xiǎomíng.","translationVi":"Tôi tên là Tiểu Minh."},{"chinese":"我是越南人。","pinyin":"Wǒ shì Yuènán rén.","translationVi":"Tôi là người Việt Nam."}]}"""),
        new(Guid.Parse("a1000000-0000-0000-0000-000000020003"), Day2Id, "EXERCISE", "Luyện tập ngày 2", 3, true, """{"questions":[{"id":"q1","type":"FILL_BLANK","question":"我___小明。","options":["叫","是","吗"],"correctAnswer":"叫"},{"id":"q2","type":"MULTIPLE_CHOICE","question":"越南 nghĩa là gì?","options":["Trung Quốc","Việt Nam","Nhật Bản"],"correctAnswer":"Việt Nam"}]}""")
    ];

    private static Vocabulary[] VocabularyItems() =>
    [
        V("1001", "学生", "xuésheng", "học sinh / sinh viên", "我是学生。", "Wǒ shì xuésheng.", "Tôi là học sinh."),
        V("1002", "大学生", "dàxuéshēng", "sinh viên đại học", "她是大学生。", "Tā shì dàxuéshēng.", "Cô ấy là sinh viên đại học."),
        V("1003", "中学生", "zhōngxuéshēng", "học sinh trung học", "他是中学生。", "Tā shì zhōngxuéshēng.", "Cậu ấy là học sinh trung học."),
        V("1004", "留学生", "liúxuéshēng", "du học sinh", "我是越南留学生。", "Wǒ shì Yuènán liúxuéshēng.", "Tôi là du học sinh Việt Nam."),
        V("1005", "老师", "lǎoshī", "giáo viên", "她是汉语老师。", "Tā shì Hànyǔ lǎoshī.", "Cô ấy là giáo viên tiếng Trung."),
        V("1006", "同学", "tóngxué", "bạn học", "他是我的同学。", "Tā shì wǒ de tóngxué.", "Cậu ấy là bạn học của tôi.")
    ];
    private static Vocabulary V(string suffix, string c, string p, string m, string ec, string ep, string et) => new(Guid.Parse($"b1000000-0000-0000-0000-00000000{suffix}"), c, p, m, 1, ec, ep, et);
    private static VocabularyRelation[] Relations()
    {
        var root = Guid.Parse("b1000000-0000-0000-0000-000000001001");
        return [new(root, Guid.Parse("b1000000-0000-0000-0000-000000001002"), "Compound"), new(root, Guid.Parse("b1000000-0000-0000-0000-000000001003"), "Compound"), new(root, Guid.Parse("b1000000-0000-0000-0000-000000001004"), "Compound"), new(root, Guid.Parse("b1000000-0000-0000-0000-000000001005"), "Semantic"), new(root, Guid.Parse("b1000000-0000-0000-0000-000000001006"), "Semantic")];
    }

    private static VocabularyGameWord[] GameWords()
    {
        var rows = new (string Chinese, string Pinyin, string Meaning)[][]
        {
            [("你好", "nǐ hǎo", "xin chào"), ("谢谢", "xièxie", "cảm ơn"), ("再见", "zàijiàn", "tạm biệt"), ("是", "shì", "là"), ("不", "bù", "không")],
            [("我", "wǒ", "tôi"), ("你", "nǐ", "bạn"), ("他", "tā", "anh ấy"), ("她", "tā", "cô ấy"), ("我们", "wǒmen", "chúng tôi")],
            [("一", "yī", "một"), ("二", "èr", "hai"), ("三", "sān", "ba"), ("四", "sì", "bốn"), ("五", "wǔ", "năm")],
            [("今天", "jīntiān", "hôm nay"), ("明天", "míngtiān", "ngày mai"), ("昨天", "zuótiān", "hôm qua"), ("现在", "xiànzài", "bây giờ"), ("时候", "shíhou", "thời gian / lúc")],
            [("爸爸", "bàba", "bố"), ("妈妈", "māma", "mẹ"), ("哥哥", "gēge", "anh trai"), ("姐姐", "jiějie", "chị gái"), ("朋友", "péngyou", "bạn bè")],
            [("学校", "xuéxiào", "trường học"), ("老师", "lǎoshī", "giáo viên"), ("学生", "xuésheng", "học sinh"), ("汉语", "hànyǔ", "tiếng Trung"), ("学习", "xuéxí", "học tập")],
            [("苹果", "píngguǒ", "táo"), ("米饭", "mǐfàn", "cơm"), ("喝水", "hē shuǐ", "uống nước"), ("喜欢", "xǐhuan", "yêu thích"), ("饭店", "fàndiàn", "nhà hàng")],
            [("医院", "yīyuàn", "bệnh viện"), ("商店", "shāngdiàn", "cửa hàng"), ("火车站", "huǒchēzhàn", "ga tàu"), ("出租车", "chūzūchē", "taxi"), ("飞机", "fēijī", "máy bay")],
            [("因为", "yīnwèi", "bởi vì"), ("所以", "suǒyǐ", "cho nên"), ("但是", "dànshì", "nhưng"), ("已经", "yǐjīng", "đã rồi"), ("正在", "zhèngzài", "đang")],
            [("环境", "huánjìng", "môi trường"), ("文化", "wénhuà", "văn hóa"), ("经验", "jīngyàn", "kinh nghiệm"), ("机会", "jīhuì", "cơ hội"), ("解决", "jiějué", "giải quyết")]
        };

        var words = new List<VocabularyGameWord>();
        var suffix = 2001;
        for (var level = 1; level <= rows.Length; level++)
        {
            for (var order = 1; order <= rows[level - 1].Length; order++)
            {
                var item = rows[level - 1][order - 1];
                words.Add(new VocabularyGameWord(
                    Guid.Parse($"b1000000-0000-0000-0000-00000000{suffix++}"),
                    level,
                    order,
                    item.Chinese,
                    item.Pinyin,
                    item.Meaning));
            }
        }
        return words.ToArray();
    }
}
