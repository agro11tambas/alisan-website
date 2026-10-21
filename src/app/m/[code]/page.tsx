import LoginLinkRedeemer from "./LoginLinkRedeemer";

// Kode login ditebus di browser lewat POST ke ERP, dan kode itu sekali pakai —
// tidak ada hasil render yang pantas disimpan atau dibagi antar pengunjung.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Masuk ke Akun Anda",
  // Link ini setara password; jangan sampai terindeks kalau bocor ke mana pun.
  robots: { index: false, follow: false },
};

export default async function LoginLinkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <LoginLinkRedeemer code={code} />;
}
