import { Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PropertyImageDisplayProps {
  propertyId: number;
  className?: string;
}

export default function PropertyImageDisplay({ propertyId, className = "relative h-48 bg-muted" }: PropertyImageDisplayProps) {
  const { data: images = [], isLoading } = trpc.admin.getPropertyImages.useQuery(
    { propertyId },
    { enabled: !!propertyId }
  );

  const primaryImage = images.find(img => img.isPrimary);
  const fallbackImage = images[0];
  const imageUrl = primaryImage?.imageUrl || fallbackImage?.imageUrl;

  if (isLoading) {
    return (
      <div className={className}>
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <Building2 className="h-16 w-16 text-muted-foreground/20" />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Property"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );
}
