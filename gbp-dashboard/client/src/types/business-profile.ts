export interface DayHours {
  isClosed: boolean;
  openTime: string;
  closeTime: string;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface BusinessProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  phoneNumber: string;
  email: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  logoUrl: string;
  coverPhotoUrl: string;
  hours: BusinessHours;
  updatedAt: string;
}

export const WEEK_DAYS: Array<keyof BusinessHours> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
