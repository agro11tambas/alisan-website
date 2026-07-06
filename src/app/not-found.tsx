import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-160px)] bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center max-w-md w-full">
        {/* Placeholder image for 404 */}
        <div className="relative w-64 h-64 mx-auto mb-8 opacity-90 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <Image
            src="https://via.placeholder.com/400x400.png?text=404+Not+Found"
            alt="404 Not Found"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Page Not Found</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Oops! We couldn't find the page you're looking for. It might have been moved, deleted, or you might have mistyped the address.
        </p>
        
        <Link 
          href="/"
          className="inline-flex h-12 items-center justify-center px-8 bg-primary text-white font-bold rounded-md hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
