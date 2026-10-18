namespace XDashboard.Api.Infrastructure;

/// <summary>
/// Minimal .env file loader so local development can use a `.env` file the same way the
/// Next.js frontend uses `.env.local`, without pulling in a NuGet dependency. Values already
/// present in the process environment (e.g. set by the hosting platform) are never overwritten.
/// </summary>
public static class EnvFile
{
    public static void Load(string path)
    {
        if (!File.Exists(path))
        {
            return;
        }

        foreach (var rawLine in File.ReadAllLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

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
