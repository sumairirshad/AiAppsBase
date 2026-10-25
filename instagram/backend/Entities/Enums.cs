namespace Instagram.Api.Entities;

public enum InstagramContentType
{
    Image,
    Carousel,
    Reels,
    Story
}

public enum PublishingJobStatus
{
    Draft,
    Pending,
    Processing,
    Published,
    Failed
}

public enum InstagramMediaKind
{
    Image,
    Video
}
