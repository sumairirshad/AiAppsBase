"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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

export function AddEntryForm({ category, categoryLabel, uploadCapable, isMockMode }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [submitError, setSubmitError] = useState(null);
  const [fileName, setFileName] = useState("");

  const form = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: { title: "", status: STATUS_OPTIONS[0], date: "", notes: "" },
  });

  async function onSubmit(values) {
    setSubmitError(null);
    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("status", values.status);
    formData.set("date", values.date || "");
    formData.set("notes", values.notes || "");
    const file = fileInputRef.current?.files?.[0];
    if (file) formData.set("video", file);

    const res = await fetch(`/api/entries/${category}`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();

    if (!result.ok) {
      setSubmitError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(`${values.title} added to ${categoryLabel}.`);
    form.reset({ title: "", status: STATUS_OPTIONS[0], date: "", notes: "" });
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.title}>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <FieldContent>
                <Input id="title" placeholder="e.g. Golden Visa explainer" {...form.register("title")} />
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

            {uploadCapable && (
              <Field>
                <FieldLabel htmlFor="video">Video file</FieldLabel>
                <FieldContent>
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    ref={fileInputRef}
                    onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                  />
                  {fileName && (
                    <FieldDescription>Selected: {fileName}</FieldDescription>
                  )}
                  <FieldDescription>
                    {isMockMode
                      ? "Mock mode: the file is noted on the entry but never uploaded anywhere."
                      : "Required in real mode — this file is uploaded to YouTube as a private video."}
                  </FieldDescription>
                </FieldContent>
              </Field>
            )}

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting} className="self-start">
                {form.formState.isSubmitting ? "Saving…" : "Add entry"}
              </Button>
              {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
