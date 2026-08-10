import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

// Dipanggil ERP setiap produk/category disimpan, dihapus, atau direstore.
// Tanpa ini halaman katalog baru ikut berubah setelah cache-nya kedaluwarsa
// sendiri (lihat `revalidate` di src/app/page.tsx dan products/[slug]).

const isSafePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.startsWith("/") &&
  !value.startsWith("//") &&
  value.length <= 200;

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return NextResponse.json(
      { message: "REVALIDATE_SECRET belum diset di website" },
      { status: 500 },
    );
  }

  if (request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body harus JSON" }, { status: 400 });
  }

  const rawPaths = (body as { paths?: unknown })?.paths;
  const paths = Array.isArray(rawPaths) ? rawPaths.filter(isSafePath) : [];

  if (paths.length === 0) {
    return NextResponse.json(
      { message: "Tidak ada path yang valid" },
      { status: 400 },
    );
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: paths, now: Date.now() });
}
