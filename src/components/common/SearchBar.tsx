"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl items-center relative">
      <button 
        type="submit" 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      >
        <Search size={16} />
      </button>
      <input
        type="text"
        placeholder="cari produk"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-10 pl-9 pr-4 text-sm bg-gray-100 border-none outline-none focus:ring-1 focus:ring-primary/20 rounded-full transition-shadow"
      />
    </form>
  );
}
