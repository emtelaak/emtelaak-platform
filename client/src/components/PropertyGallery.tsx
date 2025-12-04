import { useState } from "react";
import { Image as ImageIcon, ZoomIn } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Badge } from "@/components/ui/badge";

interface PropertyGalleryProps {
  propertyId: number;
  investmentType?: string;
  status?: string;
  language?: string;
}

export default function PropertyGallery({ 
  propertyId, 
  investmentType, 
  status,
  language = "en" 
}: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: images = [], isLoading } = trpc.admin.getPropertyImages.useQuery(
    { propertyId },
    { enabled: !!propertyId }
  );

  const primaryImage = images.find(img => img.isPrimary);
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return a.displayOrder - b.displayOrder;
  });

  const lightboxSlides = sortedImages.map(img => ({
    src: img.imageUrl,
    alt: img.caption || "Property image"
  }));

  if (isLoading) {
    return (
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="h-24 w-24 text-muted-foreground/20" />
        </div>
      </div>
    );
  }

  const mainImage = primaryImage || images[0];

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div 
          className="relative aspect-video bg-muted rounded-lg overflow-hidden group cursor-pointer"
          onClick={() => {
            setLightboxIndex(0);
            setLightboxOpen(true);
          }}
        >
          {mainImage ? (
            <>
              <img
                src={mainImage.imageUrl}
                alt={mainImage.caption || "Property"}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-24 w-24 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            {investmentType && (
              <Badge className="bg-primary text-primary-foreground">
                {investmentType === "buy_to_let" 
                  ? (language === "en" ? "High Yield" : "عائد مرتفع")
                  : (language === "en" ? "Capital Growth" : "نمو رأس المال")}
              </Badge>
            )}
            {status && (
              <Badge variant="outline" className="bg-background">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            )}
          </div>

          {/* Image Count Badge */}
          {images.length > 1 && (
            <div className="absolute bottom-4 right-4 z-10">
              <Badge className="bg-background/90 text-foreground">
                <ImageIcon className="h-3 w-3 mr-1" />
                {images.length} {language === "en" ? "Photos" : "صور"}
              </Badge>
            </div>
          )}
        </div>

        {/* Thumbnail Grid */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {sortedImages.slice(0, 4).map((img, idx) => (
              <div
                key={img.id}
                className="relative aspect-video bg-muted rounded overflow-hidden cursor-pointer group"
                onClick={() => {
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={img.imageUrl}
                  alt={img.caption || `Property image ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                {idx === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      +{images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
      />
    </>
  );
}
