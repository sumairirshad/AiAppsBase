import { businessProfileApi } from "@/lib/api/business-profile-api";
import { readLocalValue, writeLocalValue } from "@/lib/local-store";
import { BusinessProfile } from "@/types/business-profile";

const OVERRIDE_KEY = "business-profile-override";

export async function getBusinessProfile(): Promise<BusinessProfile> {
  const seedProfile = await businessProfileApi.get();
  const override = readLocalValue<BusinessProfile>(OVERRIDE_KEY);
  return override ? { ...seedProfile, ...override } : seedProfile;
}

export async function saveBusinessProfile(
  profile: BusinessProfile
): Promise<BusinessProfile> {
  const updated: BusinessProfile = { ...profile, updatedAt: new Date().toISOString() };
  writeLocalValue(OVERRIDE_KEY, updated);
  return updated;
}

export async function updateLogoCover(
  changes: Partial<Pick<BusinessProfile, "logoUrl" | "coverPhotoUrl">>
): Promise<BusinessProfile> {
  const current = await getBusinessProfile();
  return saveBusinessProfile({ ...current, ...changes });
}
