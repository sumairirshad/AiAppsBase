"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readFileAsDataUrl } from "@/lib/read-file-as-data-url";

interface ImageUploadCardProps {
  title: string;
  description: string;
  imageUrl: string;
  aspectClassName: string;
  onUpload: (dataUrl: string) => Promise<void>;
}

export function ImageUploadCard({
  title,
  description,
  imageUrl,
  aspectClassName,
  onUpload,
}: ImageUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      await onUpload(dataUrl);
      toast.success(`${title} updated`);
    } catch {
      toast.error(`Could not update ${title.toLowerCase()}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          className={`relative overflow-hidden rounded-lg border bg-muted ${aspectClassName}`}
        >
          <img
            src={imageUrl}
            alt={title}
            className="size-full object-cover"
          />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          Upload new image
        </Button>
      </CardContent>
    </Card>
  );
}
