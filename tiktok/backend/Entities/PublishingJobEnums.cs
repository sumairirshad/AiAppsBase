namespace TikTok.Api.Entities;

public enum ContentType
{
    Video,
    PhotoPost
}

public enum PublishStatus
{
    Draft,
    Pending,
    Processing,
    PublishedDirect,
    SentToInbox,
    Failed
}

public enum PostVisibility
{
    PublicToEveryone,
    SelfOnly,
    MutualFollowFriends,
    FollowerOfCreator
}
