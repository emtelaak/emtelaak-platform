import { trpc } from "@/lib/trpc";

export function usePropertyImage(propertyId: number) {
  const { data: images = [] } = trpc.admin.getPropertyImages.useQuery(
    { propertyId },
    { enabled: !!propertyId }
  );

  const primaryImage = images.find(img => img.isPrimary);
  const fallbackImage = images[0];

  return {
    imageUrl: primaryImage?.imageUrl || fallbackImage?.imageUrl || null,
    allImages: images,
    hasPrimaryImage: !!primaryImage,
  };
}
