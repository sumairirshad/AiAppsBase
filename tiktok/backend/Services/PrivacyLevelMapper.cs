using TikTok.Api.Entities;

namespace TikTok.Api.Services;

public static class PrivacyLevelMapper
{
    public static string ToTikTokValue(PostVisibility visibility) => visibility switch
    {
        PostVisibility.PublicToEveryone => "PUBLIC_TO_EVERYONE",
        PostVisibility.SelfOnly => "SELF_ONLY",
        PostVisibility.MutualFollowFriends => "MUTUAL_FOLLOW_FRIENDS",
        PostVisibility.FollowerOfCreator => "FOLLOWER_OF_CREATOR",
        _ => "SELF_ONLY"
    };
}
