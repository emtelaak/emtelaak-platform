import { useAuth } from "@/_core/hooks/useAuth";
import MobileBottomNav from "./MobileBottomNav";

export default function AuthenticatedMobileNav() {
  const { isAuthenticated, loading } = useAuth();

  if (!isAuthenticated || loading) {
    return null;
  }

  return <MobileBottomNav />;
}
