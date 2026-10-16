"use client";

import { useState } from "react";
import { toast } from "sonner";

import { BusinessHoursEditor } from "@/components/profile/business-hours-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveBusinessProfile } from "@/lib/data/business-profile";
import { BusinessProfile, DayHours } from "@/types/business-profile";

export function BusinessProfileForm({ profile }: { profile: BusinessProfile }) {
  const [formState, setFormState] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);

  function updateField<K extends keyof BusinessProfile>(
    field: K,
    value: BusinessProfile[K]
  ) {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }

  function updateHours(day: keyof BusinessProfile["hours"], patch: Partial<DayHours>) {
    setFormState((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: { ...prev.hours[day], ...patch },
      },
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveBusinessProfile(formState);
      toast.success("Business profile saved");
    } catch {
      toast.error("Could not save business profile");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Business name</Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formState.category}
              onChange={(event) => updateField("category", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={formState.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="phoneNumber">Phone number</Label>
            <Input
              id="phoneNumber"
              value={formState.phoneNumber}
              onChange={(event) => updateField("phoneNumber", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formState.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formState.website}
              onChange={(event) => updateField("website", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input
              id="addressLine1"
              value={formState.addressLine1}
              onChange={(event) => updateField("addressLine1", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input
              id="addressLine2"
              value={formState.addressLine2}
              onChange={(event) => updateField("addressLine2", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formState.city}
              onChange={(event) => updateField("city", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formState.state}
              onChange={(event) => updateField("state", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="postalCode">Postal code</Label>
            <Input
              id="postalCode"
              value={formState.postalCode}
              onChange={(event) => updateField("postalCode", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formState.country}
              onChange={(event) => updateField("country", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <BusinessHoursEditor hours={formState.hours} onChange={updateHours} />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
