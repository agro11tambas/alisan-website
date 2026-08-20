import Image from "next/image";

interface CategoryThumbProps {
  name: string;
  /** Foto kategori; bila kosong, inisial nama dipakai sebagai gantinya. */
  image?: string;
  /** Ukuran dan gaya kotak gambar, mis. "size-8 md:size-12". */
  className?: string;
  /** Diteruskan ke next/image supaya ukuran unduhan sesuai tampilan. */
  sizes?: string;
}

/**
 * Avatar kategori: foto dari ERP kalau ada, kalau tidak inisial namanya.
 * Hanya dipakai untuk kategori induk — subkategori tetap tampil sebagai teks.
 */
export default function CategoryThumb({
  name,
  image,
  className = "size-8",
  sizes = "48px",
}: CategoryThumbProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-blue-50 font-bold uppercase text-primary ${className}`}
    >
      {image ? (
        <Image src={image} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        name.trim().charAt(0)
      )}
    </span>
  );
}
