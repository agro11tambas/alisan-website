"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordInternalNavigation } from "@/lib/navigationHistory";

export default function NavigationHistory() {
  const pathname = usePathname();

  useEffect(() => {
    recordInternalNavigation(pathname);
  }, [pathname]);

  return null;
}
