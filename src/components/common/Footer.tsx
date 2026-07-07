import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-10">
      <div className="w-full px-2 sm:container sm:mx-auto sm:px-4 pt-8 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          {/* Brand */}
          <div className="max-w-md">
            <Link href="/" className="flex items-center mb-4">
              <Image 
                src="/image/1751788462_LOGO-ALISAN_cropped.png" 
                alt="Alisan Logo" 
                width={160} 
                height={60} 
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Pusat penyedia dan jasa sablon cup plastik profesional. Kami hadir untuk membantu membranding kemasan bisnis minuman Anda dengan kualitas sablon terbaik dan harga bersaing.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm text-gray-600">
            <Link href="#" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Alisan. All rights reserved.
          </p>

        </div>
      </div>
    </footer>
  );
}
