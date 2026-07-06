import Link from 'next/link';
import Image from 'next/image';
import { ProductGroup } from '@/types';
import { Star } from 'lucide-react';

export default function ProductCard({ group }: { group: ProductGroup }) {
  // Calculate starting price from available products
  const startingPrice = Math.min(...group.products.map(p => p.salePrice || p.price));
  
  return (
    <Link href={`/products/${group.slug}`} className="group bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className="relative aspect-square w-full bg-gray-50 overflow-hidden border-b border-gray-100">
        {group.image && (
          <Image 
            src={group.image} 
            alt={group.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
      </div>
      <div className="p-1.5 md:p-3 flex flex-col flex-1 gap-1 md:gap-2">
        <h3 className="text-xs md:text-sm text-gray-800 font-medium line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {group.name}
        </h3>
        
        <div className="mt-auto flex flex-col gap-0.5 md:gap-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <span className="text-[10px] md:text-xs text-gray-500 font-medium">From</span>
            <span className="text-sm sm:text-lg font-bold text-primary leading-none">
              Rp {startingPrice.toLocaleString('id-ID')}
            </span>
          </div>
          
          <div className="text-[10px] md:text-xs text-gray-500 font-medium">
            {group.products.length} options
          </div>

          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-500">
            <div className="flex items-center gap-0.5 text-yellow-500">
              <Star size={10} className="md:w-[14px] md:h-[14px]" fill="currentColor" />
              <span className="text-gray-600">{group.rating}</span>
            </div>
            <span className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-gray-300"></span>
            <span>{group.totalSold}+ sold</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
