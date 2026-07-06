import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-10">
      <div className="w-full px-2 sm:container sm:mx-auto sm:px-4 pt-8 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          {/* Brand */}
          <div className="max-w-md">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-xl tracking-tighter">
                A
              </div>
              <span className="text-2xl font-bold tracking-tight text-primary">Alisan</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your premium destination for modern ecommerce. Delivering quality products with seamless experience.
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
