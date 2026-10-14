import { z } from "zod";
import { STATUS_OPTIONS } from "./categories";

export const entrySchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Keep the title under 200 characters."),
  status: z.enum(STATUS_OPTIONS, { message: "Pick a status." }),
  date: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000, "Keep notes under 2000 characters.").optional().or(z.literal("")),
});

export const MAX_VIDEO_FILE_BYTES = 500 * 1024 * 1024; // 500MB, a simple sanity cap
