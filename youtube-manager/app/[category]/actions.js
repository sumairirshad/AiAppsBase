"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addEntry, updateEntry } from "@/lib/dataService";

export async function createEntry(category, formData) {
  addEntry(category, {
    title: formData.get("title"),
    status: formData.get("status"),
    notes: formData.get("notes"),
    date: formData.get("date"),
  });
  revalidatePath(`/${category}`);
  redirect(`/${category}`);
}

export async function editEntry(category, id, formData) {
  updateEntry(category, id, {
    title: formData.get("title"),
    status: formData.get("status"),
    notes: formData.get("notes"),
    date: formData.get("date"),
  });
  revalidatePath(`/${category}`);
  redirect(`/${category}`);
}
