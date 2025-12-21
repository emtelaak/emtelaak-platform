import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ImageCropperModal from "./ImageCropperModal";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const uploadMutation = trpc.profile.uploadProfilePicture.useMutation({
    onSuccess: (data) => {
      toast.success("Profile picture uploaded successfully!");
      setPreview(data.url);
      onUploadSuccess?.(data.url);
      setIsUploading(false);
      
      // Invalidate profile query to refresh
      utils.profile.get.invalidate();
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

    // Read file and show cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: string) => {
    // Set preview
    setPreview(croppedImage);
    
    // Upload cropped image
    setIsUploading(true);
    
    // Extract MIME type from base64 string
    const mimeMatch = croppedImage.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    
    uploadMutation.mutate({
      imageData: croppedImage,
      mimeType: mimeType,
    });
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
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage src={preview || undefined} alt={userName || "User"} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-[#003366] to-[#0059b3] text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              {preview && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                  onClick={handleRemovePicture}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                size="icon"
                className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full shadow-lg bg-[#003366] hover:bg-[#004080]"
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
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Picture
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Cropper Modal */}
      {selectedImage && (
        <ImageCropperModal
          open={showCropper}
          imageUrl={selectedImage}
          onClose={() => {
            setShowCropper(false);
            setSelectedImage(null);
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
