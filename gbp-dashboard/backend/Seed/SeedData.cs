using GbpDashboard.Api.Models;

namespace GbpDashboard.Api.Seed;

public static class SeedData
{
    public static BusinessProfile CreateBusinessProfile()
    {
        return new BusinessProfile
        {
            Id = "profile-1",
            Name = "Maple & Co. Coffee House",
            Category = "Coffee Shop",
            Description = "A cozy neighborhood coffee house serving locally roasted coffee, fresh pastries, and all-day breakfast in a warm, welcoming space.",
            PhoneNumber = "+1 (555) 234-7890",
            Email = "hello@mapleandco.example",
            Website = "https://mapleandco.example",
            AddressLine1 = "128 Birchwood Avenue",
            AddressLine2 = "Suite 2",
            City = "Portland",
            State = "OR",
            PostalCode = "97201",
            Country = "United States",
            LogoUrl = "/mock-assets/logo-placeholder.svg",
            CoverPhotoUrl = "/mock-assets/cover-placeholder.svg",
            Hours = new BusinessHours
            {
                Monday = new DayHours { OpenTime = "07:00", CloseTime = "18:00" },
                Tuesday = new DayHours { OpenTime = "07:00", CloseTime = "18:00" },
                Wednesday = new DayHours { OpenTime = "07:00", CloseTime = "18:00" },
                Thursday = new DayHours { OpenTime = "07:00", CloseTime = "18:00" },
                Friday = new DayHours { OpenTime = "07:00", CloseTime = "20:00" },
                Saturday = new DayHours { OpenTime = "08:00", CloseTime = "20:00" },
                Sunday = new DayHours { OpenTime = "08:00", CloseTime = "16:00" }
            },
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-3)
        };
    }

    public static List<Post> CreatePosts()
    {
        var now = DateTimeOffset.UtcNow;

        return new List<Post>
        {
            new Post
            {
                Id = "post-1",
                Type = PostType.Update,
                Status = PostStatus.Published,
                Title = "New fall menu is here!",
                Body = "Try our new pumpkin spice latte and maple pecan scone, available now through November.",
                ImageUrl = "/mock-assets/post-fall-menu.svg",
                ActionButtonLabel = "View menu",
                ActionButtonUrl = "https://mapleandco.example/menu",
                PublishedAt = now.AddDays(-5),
                CreatedAt = now.AddDays(-6),
                UpdatedAt = now.AddDays(-5)
            },
            new Post
            {
                Id = "post-2",
                Type = PostType.Event,
                Status = PostStatus.Scheduled,
                Title = "Live acoustic night",
                Body = "Join us for an evening of live acoustic music from local artists. Free entry, seating is limited.",
                ImageUrl = "/mock-assets/post-live-music.svg",
                ActionButtonLabel = "Reserve a table",
                ActionButtonUrl = "https://mapleandco.example/events",
                EventStartAt = now.AddDays(4).AddHours(19),
                EventEndAt = now.AddDays(4).AddHours(22),
                ScheduledAt = now.AddDays(2),
                CreatedAt = now.AddDays(-1),
                UpdatedAt = now.AddDays(-1)
            },
            new Post
            {
                Id = "post-3",
                Type = PostType.Offer,
                Status = PostStatus.Scheduled,
                Title = "20% off all cold brews",
                Body = "Beat the heat with 20% off any cold brew drink. Show this offer at checkout.",
                ImageUrl = "/mock-assets/post-cold-brew-offer.svg",
                ActionButtonLabel = "Redeem offer",
                ActionButtonUrl = "https://mapleandco.example/offers",
                OfferCode = "COLDBREW20",
                OfferValidUntil = now.AddDays(10),
                ScheduledAt = now.AddDays(1).AddHours(9),
                CreatedAt = now.AddHours(-10),
                UpdatedAt = now.AddHours(-10)
            },
            new Post
            {
                Id = "post-4",
                Type = PostType.Update,
                Status = PostStatus.Draft,
                Title = "Holiday hours announcement",
                Body = "Draft post about adjusted hours during the upcoming holiday season.",
                ImageUrl = "/mock-assets/post-holiday-hours.svg",
                CreatedAt = now.AddHours(-3),
                UpdatedAt = now.AddHours(-3)
            },
            new Post
            {
                Id = "post-5",
                Type = PostType.Update,
                Status = PostStatus.Published,
                Title = "Thank you for 5 wonderful years!",
                Body = "We're celebrating our 5th anniversary this month. Thank you to our amazing community for the support.",
                ImageUrl = "/mock-assets/post-anniversary.svg",
                PublishedAt = now.AddDays(-14),
                CreatedAt = now.AddDays(-15),
                UpdatedAt = now.AddDays(-14)
            }
        };
    }

    public static List<MediaItem> CreateMediaItems()
    {
        var now = DateTimeOffset.UtcNow;

        return new List<MediaItem>
        {
            new MediaItem
            {
                Id = "media-1",
                Type = MediaType.Photo,
                Category = MediaCategory.Interior,
                Url = "/mock-assets/media-interior-1.svg",
                ThumbnailUrl = "/mock-assets/media-interior-1.svg",
                Caption = "Main seating area with natural light",
                UploadedAt = now.AddDays(-30)
            },
            new MediaItem
            {
                Id = "media-2",
                Type = MediaType.Photo,
                Category = MediaCategory.Exterior,
                Url = "/mock-assets/media-exterior-1.svg",
                ThumbnailUrl = "/mock-assets/media-exterior-1.svg",
                Caption = "Storefront on Birchwood Avenue",
                UploadedAt = now.AddDays(-28)
            },
            new MediaItem
            {
                Id = "media-3",
                Type = MediaType.Photo,
                Category = MediaCategory.Food,
                Url = "/mock-assets/media-food-1.svg",
                ThumbnailUrl = "/mock-assets/media-food-1.svg",
                Caption = "Fresh pastry selection",
                UploadedAt = now.AddDays(-20)
            },
            new MediaItem
            {
                Id = "media-4",
                Type = MediaType.Photo,
                Category = MediaCategory.Product,
                Url = "/mock-assets/media-product-1.svg",
                ThumbnailUrl = "/mock-assets/media-product-1.svg",
                Caption = "Signature maple latte",
                UploadedAt = now.AddDays(-12)
            },
            new MediaItem
            {
                Id = "media-5",
                Type = MediaType.Video,
                Category = MediaCategory.Team,
                Url = "/mock-assets/media-team-video.svg",
                ThumbnailUrl = "/mock-assets/media-team-video-thumb.svg",
                Caption = "Meet our baristas",
                UploadedAt = now.AddDays(-7)
            },
            new MediaItem
            {
                Id = "media-6",
                Type = MediaType.Photo,
                Category = MediaCategory.Interior,
                Url = "/mock-assets/media-interior-2.svg",
                ThumbnailUrl = "/mock-assets/media-interior-2.svg",
                Caption = "Cozy reading corner",
                UploadedAt = now.AddDays(-4)
            }
        };
    }
}
