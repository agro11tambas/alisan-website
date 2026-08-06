"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Category } from "@/types";

interface CategorySidebarProps {
  /** Top-level categories, each carrying its nested children. */
  categories: Category[];
  activeId?: string;
  /** Ids from the active category up to its root, so that branch starts open. */
  activePathIds: string[];
}

export default function CategorySidebar({
  categories,
  activeId,
  activePathIds,
}: CategorySidebarProps) {
  const [openIds, setOpenIds] = useState<string[]>(activePathIds);

  const toggle = (id: string) =>
    setOpenIds((ids) =>
      ids.includes(id) ? ids.filter((openId) => openId !== id) : [...ids, id],
    );

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm sticky top-24">
      <h2 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
        Kategori
      </h2>

      <nav>
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/products"
              className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                !activeId
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-gray-600 hover:bg-gray-50 hover:text-primary"
              }`}
            >
              Semua Kategori
            </Link>
          </li>

          {categories.map((category) => {
            const hasChildren = category.children.length > 0;
            const isOpen = openIds.includes(category.id);
            const isActive = activeId === category.id;

            return (
              <li key={category.id}>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/products?category=${category.slug}`}
                    className={`flex-1 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                    }`}
                  >
                    {category.name}
                  </Link>

                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggle(category.id)}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? "Tutup" : "Buka"} subkategori ${category.name}`}
                      className="grid size-6 shrink-0 place-items-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <ChevronDown
                        size={15}
                        className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>

                {hasChildren && isOpen && (
                  <ul className="mt-0.5 ml-3 space-y-0.5 border-l border-gray-100 pl-2">
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/products?category=${child.slug}`}
                          className={`block rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                            activeId === child.id
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                          }`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
