"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

function AuthCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <p className="text-sm text-gray-500">Mengarahkan ke halaman login...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}
