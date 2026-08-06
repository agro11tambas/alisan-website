import Link from "next/link";
import { Category } from "@/types";

interface CategoryChipsProps {
  /** Top-level categories, each carrying its nested children. */
  categories: Category[];
  activeId?: string;
  /** Root of the active branch — drives which subcategory row is shown. */
  activeRoot?: Category;
}

const chipClass = (state: "active" | "branch" | "idle") =>
  `shrink-0 h-7 px-2.5 flex items-center rounded-full border text-[11px] font-medium transition-colors ${
    state === "active"
      ? "bg-primary text-white border-primary"
      : state === "branch"
        ? "bg-primary/10 text-primary border-primary/30"
        : "bg-white text-gray-700 border-gray-200 hover:border-primary/50"
  }`;

export default function CategoryChips({
  categories,
  activeId,
  activeRoot,
}: CategoryChipsProps) {
  const subCategories = activeRoot?.children ?? [];

  const scroller =
    "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

  return (
    <div className="lg:hidden -mx-2 px-2 space-y-1.5 sm:-mx-4 sm:px-4">
      <div className={scroller}>
        <div className="flex gap-1.5 pb-0.5">
          <Link href="/products" className={chipClass(activeId ? "idle" : "active")}>
            Semua
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={chipClass(
                activeId === category.id
                  ? "active"
                  : activeRoot?.id === category.id
                    ? "branch"
                    : "idle",
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {subCategories.length > 0 && (
        <div className={scroller}>
          <div className="flex items-center gap-1.5 pb-1.5">
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Sub
            </span>
            <Link
              href={`/products?category=${activeRoot!.slug}`}
              className={chipClass(activeId === activeRoot!.id ? "active" : "idle")}
            >
              Semua
            </Link>
            {subCategories.map((child) => (
              <Link
                key={child.id}
                href={`/products?category=${child.slug}`}
                className={chipClass(activeId === child.id ? "active" : "idle")}
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
