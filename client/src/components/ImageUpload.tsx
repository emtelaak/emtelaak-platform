import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ImageUploadProps {
  label: string;
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  label,
  currentImageUrl,
  onImageUploaded,
  accept = "image/*",
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);

  const uploadImageMutation = trpc.content.uploadImage.useMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        try {
          // Upload to server
          const result = await uploadImageMutation.mutateAsync({
            fileName: file.name,
            fileData: base64String,
            contentType: file.type,
          });

          setPreviewUrl(result.url);
          onImageUploaded(result.url);
          toast.success('Image uploaded successfully');
        } catch (error) {
          console.error('Upload error:', error);
          toast.error('Failed to upload image');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Failed to process file');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onImageUploaded('');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {previewUrl ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-xs max-h-48 rounded-lg border object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id={`image-upload-${label}`}
            disabled={uploading}
          />
          <label
            htmlFor={`image-upload-${label}`}
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  Max file size: {maxSizeMB}MB
                </p>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
