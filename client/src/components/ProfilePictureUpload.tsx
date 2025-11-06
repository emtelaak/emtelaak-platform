import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProfilePictureUploadProps {
  currentPicture?: string | null;
  userName?: string;
  onUploadSuccess?: (url: string) => void;
}

export default function ProfilePictureUpload({
  currentPicture,
  userName,
  onUploadSuccess,
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPicture || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.profile.uploadProfilePicture.useMutation({
    onSuccess: (data) => {
      toast.success("Profile picture uploaded successfully!");
      setPreview(data.url);
      onUploadSuccess?.(data.url);
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setIsUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      
      // Upload to server
      setIsUploading(true);
      uploadMutation.mutate({
        imageData: result,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getInitials = () => {
    if (!userName) return "U";
    const names = userName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return userName[0].toUpperCase();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-32 w-32">
              <AvatarImage src={preview || undefined} alt={userName || "User"} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            
            {preview && (
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                onClick={handleRemovePicture}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera className="h-5 w-5" />
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />

          <div className="text-center">
            <p className="text-sm font-medium">Profile Picture</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG or GIF. Max size 5MB
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload New Picture"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
