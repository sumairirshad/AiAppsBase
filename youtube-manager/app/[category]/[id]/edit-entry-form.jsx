"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { entrySchema } from "@/lib/validation";
import { STATUS_OPTIONS } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EditEntryForm({ category, categoryLabel, entry }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState(null);

  const form = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      title: entry.title || "",
      status: entry.status || STATUS_OPTIONS[0],
      date: entry.date || "",
      notes: entry.notes || "",
    },
  });

  async function onSubmit(values) {
    setSubmitError(null);
    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("status", values.status);
    formData.set("date", values.date || "");
    formData.set("notes", values.notes || "");

    const res = await fetch(`/api/entries/${category}/${entry.id}`, {
      method: "PATCH",
      body: formData,
    });
    const result = await res.json();

    if (!result.ok) {
      setSubmitError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(`${values.title} updated.`);
    router.push(`/${category}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        render={<Link href={`/${category}`} />}
      >
        <ArrowLeft className="size-4" />
        {categoryLabel}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.title}>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <FieldContent>
                  <Input id="title" {...form.register("title")} />
                  <FieldError errors={[form.formState.errors.title]} />
                </FieldContent>
              </Field>

              <Field data-invalid={!!form.formState.errors.status}>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value, { shouldValidate: true })}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[form.formState.errors.status]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <FieldContent>
                  <Input id="date" type="date" {...form.register("date")} />
                </FieldContent>
              </Field>

              <Field data-invalid={!!form.formState.errors.notes}>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <FieldContent>
                  <Textarea id="notes" rows={3} {...form.register("notes")} />
                  <FieldError errors={[form.formState.errors.notes]} />
                </FieldContent>
              </Field>

              {entry.youtubeUrl && (
                <FieldDescription>
                  Linked to a real YouTube resource:{" "}
                  <a href={entry.youtubeUrl} target="_blank" rel="noreferrer" className="underline">
                    {entry.youtubeUrl}
                  </a>
                  . Saving here updates its title/description on YouTube too.
                </FieldDescription>
              )}

              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={form.formState.isSubmitting} className="self-start">
                  {form.formState.isSubmitting ? "Saving…" : "Save changes"}
                </Button>
                {submitError && <p className="text-sm text-destructive">{submitError}</p>}
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
