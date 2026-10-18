"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, Pin } from "lucide-react";
import { toast } from "sonner";

import { useProfile, useUpdateProfile, useUploadProfilePicture, useUploadProfileBanner } from "@/hooks/use-profile";
import { usePosts } from "@/hooks/use-posts";
import { useConnectionStatus } from "@/hooks/use-connection";
import { ApiError } from "@/lib/api-client";
import { ApiErrorState } from "@/components/common/api-error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BIO_LIMIT = 160;

/// Reads the x_connected/x_error query params the OAuth callback redirect adds and shows a
/// toast once. Split out so only this small piece needs the Suspense boundary useSearchParams
/// requires for static rendering, instead of the whole page.
function OAuthCallbackToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const connected = searchParams.get("x_connected");
    const xError = searchParams.get("x_error");
    if (connected === "1") {
      toast.success("X account connected");
    } else if (connected === "0") {
      toast.error(xError ? `Could not connect X account: ${xError}` : "Could not connect X account.");
    }
    // Only meant to run once per redirect back from the OAuth callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function ProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const { data: posts } = usePosts();
  const { data: connection } = useConnectionStatus();
  const updateProfile = useUpdateProfile();
  const uploadPicture = useUploadProfilePicture();
  const uploadBanner = useUploadProfileBanner();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setLocation(profile.location);
    setWebsite(profile.website);
    setPinnedPostId(profile.pinnedPostId);
  }, [profile]);

  function handlePictureChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    uploadPicture.mutate(file, {
      onSuccess: () => toast.success("Profile picture updated"),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update profile picture."),
    });
  }

  function handleBannerChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    uploadBanner.mutate(file, {
      onSuccess: () => toast.success("Cover image updated"),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update cover image."),
    });
  }

  function handleSave() {
    if (!displayName.trim()) {
      toast.error("Display name is required.");
      return;
    }

    updateProfile.mutate(
      { displayName, bio, location, website, pinnedPostId },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update profile."),
      }
    );
  }

  const pinnedPost = posts?.find((post) => post.id === pinnedPostId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !profile) {
    return <ApiErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <OAuthCallbackToast />
      </Suspense>

      {connection && connection.connected && (
        <p className="text-sm text-muted-foreground">
          Connected to X as @{connection.handle}. {profile.followersCount.toLocaleString()} followers
          &middot; {profile.followingCount.toLocaleString()} following.
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="relative h-40 w-full bg-muted sm:h-56">
          {profile.coverImageUrl && (
            <Image src={profile.coverImageUrl} alt="Cover" fill className="object-cover" unoptimized />
          )}
          <label className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background">
            {uploadBanner.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadBanner.isPending}
              onChange={handleBannerChange}
            />
          </label>
        </div>
        <CardContent className="relative pt-16">
          <div className="absolute -top-12 left-6 h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-muted">
            {profile.profilePictureUrl && (
              <Image src={profile.profilePictureUrl} alt={displayName} fill className="object-cover" unoptimized />
            )}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 text-transparent hover:bg-black/40 hover:text-white">
              {uploadPicture.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadPicture.isPending}
                onChange={handlePictureChange}
              />
            </label>
          </div>
          <div>
            <p className="text-lg font-semibold">{displayName}</p>
            <p className="text-sm text-muted-foreground">@{profile.handle}</p>
          </div>

          {pinnedPost && (
            <div className="mt-4 rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Pin className="h-3 w-3" />
                Pinned post
              </div>
              <p className="text-sm">{pinnedPost.text}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="handle">Handle</Label>
              <Input id="handle" value={`@${profile.handle}`} disabled />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value.slice(0, BIO_LIMIT))}
              rows={3}
            />
            <p className="text-right text-xs text-muted-foreground">
              {bio.length}/{BIO_LIMIT}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Account type</Label>
              <Select value={profile.accountType} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Derived from X&apos;s verification type; not editable via the X API.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value="Not available via X API" disabled />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value="Not exposed by X API" disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value="Not exposed by X API" disabled />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Pinned post</Label>
            <Select
              value={pinnedPostId ?? "none"}
              onValueChange={(value) =>
                setPinnedPostId(value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No pinned post" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No pinned post</SelectItem>
                {posts?.map((post) => (
                  <SelectItem key={post.id} value={post.id}>
                    {post.text.slice(0, 60) || `Image post (${post.id})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
