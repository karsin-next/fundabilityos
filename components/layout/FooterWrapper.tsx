"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  // Hide footer on specific app pages that need 100vh / full screen
  const hideFooterRoutes = ["/interview", "/upload", "/dashboard"];
  const shouldHide = hideFooterRoutes.some((route) => pathname?.startsWith(route));

  if (shouldHide) return null;

  return <Footer />;
}
