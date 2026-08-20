"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, ExternalLink, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import api from "@/services/api";

export default function AddressesPage() {
  const router = useRouter();
  const { customer, loading, isLoggedIn, refreshCustomer } = useCurrentCustomer();
  const [savingAddressId, setSavingAddressId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/login");
  }, [isLoggedIn, loading, router]);

  const handleSetDefault = async (addressId: string | number) => {
    setSavingAddressId(addressId);

    try {
      await api.put(`/ecommerce/auth/addresses/${addressId}/default`);
      await refreshCustomer();
      toast.success("Alamat utama berhasil diperbarui.");
    } catch (error) {
      console.error("Gagal mengubah alamat utama:", error);
      toast.error("Gagal mengubah alamat utama. Coba lagi.");
    } finally {
      setSavingAddressId(null);
    }
  };

  if (loading || !isLoggedIn) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const businesses = customer?.customers ?? [];
  const addressCount = businesses.reduce(
    (total, business) => total + (business.addresses?.length ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/account"
            aria-label="Kembali ke profil"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={19} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Alamat Saya</h1>
            <p className="text-xs text-gray-500">
              {addressCount} alamat tersimpan
            </p>
          </div>
        </div>

        {addressCount === 0 ? (
          <section className="rounded-xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <MapPin size={24} className="text-gray-400" />
            </div>
            <h2 className="mb-1 text-base font-bold text-gray-900">Belum ada alamat</h2>
            <p className="text-sm text-gray-500">
              Hubungi admin untuk menambahkan alamat pengiriman.
            </p>
          </section>
        ) : (
          <div className="space-y-4">
            {businesses.map((business) => {
              if (!business.addresses?.length) return null;

              return (
                <section
                  key={business.id}
                  className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <header className="flex items-start gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Building2 size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold text-gray-900">
                        {business.name}
                      </h2>
                      {business.phone && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone size={12} />
                          {business.phone}
                        </p>
                      )}
                    </div>
                  </header>

                  <div className="divide-y divide-gray-100">
                    {business.addresses.map((address) => {
                      const fullAddress = address.address || address.completeAddress || "Alamat belum lengkap";
                      const mapsLink = address.google_maps || address.googleMapsLink;
                      const isDefault = address.is_default || address.isDefault;

                      return (
                        <article key={address.id} className="flex items-start gap-3 px-4 py-4">
                          <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {address.business_name || address.businessName || business.name}
                              </h3>
                              {isDefault && (
                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                                  Utama
                                </span>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed text-gray-600">
                              {fullAddress}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              {mapsLink && (
                                <a
                                  href={mapsLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                                >
                                  Lihat di Google Maps
                                  <ExternalLink size={12} />
                                </a>
                              )}
                              {!isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefault(address.id)}
                                  disabled={savingAddressId !== null}
                                  className="inline-flex items-center rounded-md border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {savingAddressId === address.id
                                    ? "Menyimpan..."
                                    : "Jadikan Alamat Utama"}
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            <p className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-500">
              Alamat utama dapat kamu atur sendiri di sini. Untuk menambah atau mengubah
              isi alamat, hubungi admin.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
