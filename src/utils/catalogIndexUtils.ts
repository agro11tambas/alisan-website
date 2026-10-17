import { CatalogIndexEntry } from "@/types";

/**
 * Kunci pencocokan nama produk. Penanda "(BUNDLE)" dari ERP, spasi ganda dan
 * beda huruf besar/kecil tidak boleh membuat produk yang sama dianggap beda.
 */
export const normalizeCatalogKey = (value: string) =>
  value
    .replace(/\s*\(\s*bundle\s*\)\s*/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .toLowerCase();

export type CatalogLookup = {
  byErpId: Map<string, CatalogIndexEntry>;
  byName: Map<string, CatalogIndexEntry>;
};

export function buildCatalogLookup(catalog: CatalogIndexEntry[]): CatalogLookup {
  const byErpId = new Map<string, CatalogIndexEntry>();
  const byName = new Map<string, CatalogIndexEntry>();

  catalog.forEach((entry) => {
    entry.erpIds.forEach((erpId) => {
      if (!byErpId.has(erpId)) byErpId.set(erpId, entry);
    });
    entry.aliases.forEach((alias) => {
      if (!byName.has(alias)) byName.set(alias, entry);
    });
  });

  return { byErpId, byName };
}

/**
 * Mencari produk katalog untuk satu baris pesanan. Id produk ERP dipakai lebih
 * dulu karena pasti, nama hanya cadangan untuk pesanan lama yang baris ERP-nya
 * sudah dihapus atau belum terhubung ke katalog.
 */
export function findCatalogEntry(
  lookup: CatalogLookup,
  item: { product_id: number | null; product_name: string },
): CatalogIndexEntry | undefined {
  if (item.product_id !== null) {
    const byErpId = lookup.byErpId.get(String(item.product_id));
    if (byErpId) return byErpId;
  }

  return lookup.byName.get(normalizeCatalogKey(item.product_name));
}
