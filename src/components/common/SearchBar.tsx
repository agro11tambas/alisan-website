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
      <input
        type="text"
        placeholder="Search for products, brands and more"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-10 pl-4 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-shadow"
      />
      <button 
        type="submit" 
        className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center bg-primary text-primary-foreground rounded-r-md hover:bg-primary/90 transition-colors"
      >
        <Search size={18} />
      </button>
    </form>
  );
}
