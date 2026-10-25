using System.Text.Json.Serialization;

namespace TikTok.Api.Models.TikTok;

public class PostInfo
{
    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("privacy_level")]
    public string PrivacyLevel { get; set; } = "SELF_ONLY";

    [JsonPropertyName("disable_duet")]
    public bool DisableDuet { get; set; } = false;

    [JsonPropertyName("disable_comment")]
    public bool DisableComment { get; set; } = false;

    [JsonPropertyName("disable_stitch")]
    public bool DisableStitch { get; set; } = false;

    [JsonPropertyName("video_cover_timestamp_ms")]
    public int? VideoCoverTimestampMs { get; set; }

    [JsonPropertyName("auto_add_music")]
    public bool? AutoAddMusic { get; set; }
}

public class PullFromUrlSourceInfo
{
    [JsonPropertyName("source")]
    public string Source { get; set; } = "PULL_FROM_URL";

    [JsonPropertyName("video_url")]
    public string? VideoUrl { get; set; }

    [JsonPropertyName("photo_cover_index")]
    public int? PhotoCoverIndex { get; set; }

    [JsonPropertyName("photo_images")]
    public List<string>? PhotoImages { get; set; }
}

public class VideoPublishInitRequest
{
    [JsonPropertyName("post_info")]
    public PostInfo PostInfo { get; set; } = new();

    [JsonPropertyName("source_info")]
    public PullFromUrlSourceInfo SourceInfo { get; set; } = new();

    [JsonPropertyName("post_mode")]
    public string PostMode { get; set; } = "MEDIA_UPLOAD";
}

public class PhotoPublishInitRequest
{
    [JsonPropertyName("post_info")]
    public PostInfo PostInfo { get; set; } = new();

    [JsonPropertyName("source_info")]
    public PullFromUrlSourceInfo SourceInfo { get; set; } = new();

    [JsonPropertyName("post_mode")]
    public string PostMode { get; set; } = "MEDIA_UPLOAD";

    [JsonPropertyName("media_type")]
    public string MediaType { get; set; } = "PHOTO";
}

public class PublishInitData
{
    [JsonPropertyName("publish_id")]
    public string PublishId { get; set; } = string.Empty;

    [JsonPropertyName("upload_url")]
    public string? UploadUrl { get; set; }
}

public class PublishInitResponse
{
    [JsonPropertyName("data")]
    public PublishInitData Data { get; set; } = new();

    [JsonPropertyName("error")]
    public TikTokApiError Error { get; set; } = new();
}

public class PublishStatusFetchRequest
{
    [JsonPropertyName("publish_id")]
    public string PublishId { get; set; } = string.Empty;
}

public class PublishStatusData
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("fail_reason")]
    public string? FailReason { get; set; }

    [JsonPropertyName("publicaly_available_post_id")]
    public List<string>? PublicAvailablePostIds { get; set; }

    [JsonPropertyName("uploaded_bytes")]
    public long? UploadedBytes { get; set; }
}

public class PublishStatusResponse
{
    [JsonPropertyName("data")]
    public PublishStatusData Data { get; set; } = new();

    [JsonPropertyName("error")]
    public TikTokApiError Error { get; set; } = new();
}
