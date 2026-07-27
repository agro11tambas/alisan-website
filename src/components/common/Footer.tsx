"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const hideOnMobile = pathname === '/cart' || pathname === '/checkout';

  return (
    <footer className={`${hideOnMobile ? 'hidden md:block' : ''} bg-white border-t border-border mt-10`}>
      <div className="w-full px-2 sm:container sm:mx-auto sm:px-4 py-8 flex justify-center items-center">
        <Link href="/">
          <Image 
            src="/image/1751788462_LOGO-ALISAN_cropped.png" 
            alt="Alisan Logo" 
            width={160} 
            height={60} 
            className="h-10 w-auto object-contain"
          />
        </Link>
      </div>
    </footer>
  );
}
