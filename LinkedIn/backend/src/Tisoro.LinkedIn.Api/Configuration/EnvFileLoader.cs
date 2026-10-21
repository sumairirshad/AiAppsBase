namespace Tisoro.LinkedIn.Api.Configuration;

/// <summary>
/// Loads a local ".env" file into process environment variables, for developer
/// convenience only. In every other environment (CI, containers, real hosting)
/// the actual environment variables are set by the platform and this is a
/// no-op because no .env file exists there — it never overrides a variable
/// that is already set, so real deployment config always wins.
/// </summary>
public static class EnvFileLoader
{
    public static void LoadIfPresent(string basePath)
    {
        var path = Path.Combine(basePath, ".env");
        if (!File.Exists(path)) return;

        foreach (var rawLine in File.ReadAllLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0) continue;

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim();
            if (value.Length >= 2 && value[0] == '"' && value[^1] == '"')
            {
                value = value[1..^1];
            }

            if (Environment.GetEnvironmentVariable(key) is null)
            {
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }
}
