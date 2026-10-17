"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera, Pin } from "lucide-react";
import { toast } from "sonner";

import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { usePosts } from "@/hooks/use-posts";
import type { AccountType } from "@/lib/types";
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

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { data: posts } = usePosts();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("Personal");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setProfilePictureUrl(profile.profilePictureUrl);
    setCoverImageUrl(profile.coverImageUrl);
    setAccountType(profile.accountType);
    setCategory(profile.category);
    setPhone(profile.phone);
    setEmail(profile.email);
    setLocation(profile.location);
    setWebsite(profile.website);
    setPinnedPostId(profile.pinnedPostId);
  }, [profile]);

  function handleImagePick(
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setter(URL.createObjectURL(file));
  }

  function handleSave() {
    if (!displayName.trim()) {
      toast.error("Display name is required.");
      return;
    }

    updateProfile.mutate(
      {
        displayName,
        bio,
        profilePictureUrl,
        coverImageUrl,
        accountType,
        category,
        phone,
        email,
        location,
        website,
        pinnedPostId,
      },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: () => toast.error("Could not update profile."),
      }
    );
  }

  const pinnedPost = posts?.find((post) => post.id === pinnedPostId);

  if (isLoading || !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative h-40 w-full bg-muted sm:h-56">
          <Image
            src={coverImageUrl}
            alt="Cover"
            fill
            className="object-cover"
            unoptimized
          />
          <label className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background">
            <Camera className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleImagePick(event, setCoverImageUrl)}
            />
          </label>
        </div>
        <CardContent className="relative pt-16">
          <div className="absolute -top-12 left-6 h-24 w-24 overflow-hidden rounded-full border-4 border-background">
            <Image
              src={profilePictureUrl}
              alt={displayName}
              fill
              className="object-cover"
              unoptimized
            />
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 text-transparent hover:bg-black/40 hover:text-white">
              <Camera className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImagePick(event, setProfilePictureUrl)}
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
              <Select
                value={accountType}
                onValueChange={(value) => setAccountType(value as AccountType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
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
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
