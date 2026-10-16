import { httpClient } from "@/lib/api/http-client";
import { BusinessProfile } from "@/types/business-profile";

export const businessProfileApi = {
  get: () => httpClient.get<BusinessProfile>("/api/business-profile"),
};
