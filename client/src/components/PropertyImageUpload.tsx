import { useState, useRef, useCallback } from "react";
import { Upload, X, Star, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PropertyImageUploadProps {
  propertyId: number;
}

interface UploadedImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
  caption?: string | null;
  captionAr?: string | null;
}

export default function PropertyImageUpload({ propertyId }: PropertyImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  
  // Fetch existing images
  const { data: images = [], isLoading } = trpc.admin.getPropertyImages.useQuery({ propertyId });

  // Upload mutation
  const uploadMutation = trpc.admin.uploadPropertyImage.useMutation({
    onSuccess: () => {
      utils.admin.getPropertyImages.invalidate({ propertyId });
      toast.success("Image uploaded successfully");
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  // Set primary mutation
  const setPrimaryMutation = trpc.admin.setPrimaryImage.useMutation({
    onSuccess: () => {
      utils.admin.getPropertyImages.invalidate({ propertyId });
      toast.success("Primary image updated");
    },
  });

  // Delete mutation
  const deleteMutation = trpc.admin.deletePropertyImage.useMutation({
    onSuccess: () => {
      utils.admin.getPropertyImages.invalidate({ propertyId });
      toast.success("Image deleted");
    },
  });

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        // Convert to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const imageData = await base64Promise;

        // Upload to server
        await uploadMutation.mutateAsync({
          propertyId,
          imageData,
          fileName: file.name,
          isPrimary: images.length === 0 && i === 0, // First image is primary if no images exist
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [propertyId, images.length, uploadMutation]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleSetPrimary = useCallback((imageId: number) => {
    setPrimaryMutation.mutate({ imageId, propertyId });
  }, [propertyId, setPrimaryMutation]);

  const handleDelete = useCallback((imageId: number) => {
    if (confirm("Are you sure you want to delete this image?")) {
      deleteMutation.mutate({ imageId });
    }
  }, [deleteMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload Property Images</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop images here, or click to browse
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select Images
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Maximum file size: 5MB. Supported formats: JPG, PNG, WebP
          </p>
        </div>
      </Card>

      {/* Image Grid */}
      {images.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Uploaded Images ({images.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="relative group overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={image.imageUrl}
                    alt={image.caption || "Property image"}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary Badge */}
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Primary
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!image.isPrimary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSetPrimary(image.id)}
                        disabled={setPrimaryMutation.isPending}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Set Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(image.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Caption */}
                {image.caption && (
                  <div className="p-2 text-xs text-muted-foreground truncate">
                    {image.caption}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No images uploaded yet. Upload your first image to get started.</p>
        </div>
      )}
    </div>
  );
}
