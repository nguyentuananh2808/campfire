using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Campfire.IntegrationTests;

public sealed class LearningVocabularyGameApiTests(CampfireApiFactory factory) : IClassFixture<CampfireApiFactory>
{
    [Fact]
    public async Task Completing_a_level_persists_progress_and_unlocks_only_the_next_level()
    {
        using var client = factory.CreateClient();
        await RegisterAsync(client);

        var initial = await client.GetAsync("/api/v1/learning/vocabulary-game");
        initial.EnsureSuccessStatusCode();
        using (var document = JsonDocument.Parse(await initial.Content.ReadAsStringAsync()))
        {
            var levels = document.RootElement.GetProperty("levels");
            Assert.Equal(10, levels.GetArrayLength());
            Assert.True(levels[0].GetProperty("isUnlocked").GetBoolean());
            Assert.Equal(5, levels[0].GetProperty("words").GetArrayLength());
            Assert.False(levels[1].GetProperty("isUnlocked").GetBoolean());
            Assert.Empty(levels[1].GetProperty("words").EnumerateArray());
        }

        await PrimeAntiforgeryAsync(client);
        var locked = await client.PostAsJsonAsync("/api/v1/learning/vocabulary-game/results", new
        {
            level = 2,
            score = 800,
            correct = 8,
            total = 8,
            remainingLives = 2
        });
        Assert.Equal(HttpStatusCode.Forbidden, locked.StatusCode);

        var completed = await client.PostAsJsonAsync("/api/v1/learning/vocabulary-game/results", new
        {
            level = 1,
            score = 760,
            correct = 7,
            total = 7,
            remainingLives = 2
        });
        completed.EnsureSuccessStatusCode();
        using (var document = JsonDocument.Parse(await completed.Content.ReadAsStringAsync()))
        {
            Assert.True(document.RootElement.GetProperty("completed").GetBoolean());
            Assert.True(document.RootElement.GetProperty("newlyCompleted").GetBoolean());
            Assert.Equal(2, document.RootElement.GetProperty("highestUnlockedLevel").GetInt32());
        }

        var refreshed = await client.GetAsync("/api/v1/learning/vocabulary-game");
        refreshed.EnsureSuccessStatusCode();
        using var refreshedDocument = JsonDocument.Parse(await refreshed.Content.ReadAsStringAsync());
        var refreshedLevels = refreshedDocument.RootElement.GetProperty("levels");
        Assert.True(refreshedLevels[0].GetProperty("isCompleted").GetBoolean());
        Assert.True(refreshedLevels[1].GetProperty("isUnlocked").GetBoolean());
        Assert.Equal(5, refreshedLevels[1].GetProperty("words").GetArrayLength());
        Assert.False(refreshedLevels[2].GetProperty("isUnlocked").GetBoolean());
    }

    private static async Task RegisterAsync(HttpClient client)
    {
        await PrimeAntiforgeryAsync(client);
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email = $"learner-{Guid.NewGuid():N}@example.com",
            password = "StrongPassword!1",
            displayName = "Người học"
        });
        response.EnsureSuccessStatusCode();
    }

    private static async Task PrimeAntiforgeryAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/v1/auth/antiforgery");
        response.EnsureSuccessStatusCode();
        var cookie = response.Headers.GetValues("Set-Cookie")
            .Single(value => value.StartsWith("XSRF-TOKEN=", StringComparison.Ordinal));
        var token = Uri.UnescapeDataString(cookie.Split(';', 2)[0]["XSRF-TOKEN=".Length..]);
        client.DefaultRequestHeaders.Remove("X-XSRF-TOKEN");
        client.DefaultRequestHeaders.Add("X-XSRF-TOKEN", token);
    }
}
