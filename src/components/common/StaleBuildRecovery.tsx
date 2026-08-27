/**
 * Penyelamat halaman yang HTML-nya sudah basi.
 *
 * Nama file chunk berubah tiap build. Kalau sebuah HTML lama masih tersimpan —
 * di edge CDN maupun di cache browser pengunjung — HTML itu menunjuk ke chunk
 * yang sudah tidak ada, semuanya 404, dan halaman tampil tanpa CSS sekaligus
 * tanpa interaksi (atau gagal total). Purge CDN membereskan sisi edge, tapi
 * tidak menyentuh salinan yang sudah telanjur ada di browser orang.
 *
 * Skripnya sengaja ditulis sebagai string dan dipasang lewat
 * `dangerouslySetInnerHTML` supaya ikut di HTML awal dan sudah aktif sebelum
 * chunk mana pun sempat gagal — komponen React biasa baru hidup setelah
 * bundel-nya berhasil dimuat, yang justru bagian yang rusak di kasus ini.
 *
 * Pemuatan ulang dipaksa lewat URL bercap waktu (bukan `location.reload()`)
 * karena reload biasa masih boleh dilayani dari cache yang sama basinya.
 * Sekali per tab per alamat, ditandai di sessionStorage, supaya halaman yang
 * memang rusak karena sebab lain tidak berputar memuat ulang tanpa henti.
 */
const RECOVERY_SCRIPT = `
(function () {
  var PARAM = "_stale";
  var FLAG = "alisan:stale-reload:" + location.pathname;

  function isStaleAssetError(target) {
    if (!target || !target.tagName) return false;
    var tag = target.tagName.toLowerCase();
    if (tag !== "script" && tag !== "link") return false;
    var url = target.src || target.href || "";
    return url.indexOf("/_next/static/") !== -1;
  }

  function isChunkLoadError(reason) {
    if (!reason) return false;
    var name = reason.name || "";
    var message = reason.message || String(reason);
    return name === "ChunkLoadError" || /Failed to load chunk|Loading chunk \\S+ failed/i.test(message);
  }

  function recover() {
    try {
      if (sessionStorage.getItem(FLAG)) return;
      sessionStorage.setItem(FLAG, "1");
    } catch (storageError) {
      // Mode privat tanpa sessionStorage: lebih baik tidak memuat ulang sama
      // sekali daripada berisiko berputar terus.
      return;
    }

    var url = new URL(location.href);
    url.searchParams.set(PARAM, Date.now().toString(36));
    location.replace(url.toString());
  }

  var sawAssetError = false;

  window.addEventListener("error", function (event) {
    if (isStaleAssetError(event.target)) {
      sawAssetError = true;
      recover();
    }
  }, true);

  window.addEventListener("unhandledrejection", function (event) {
    if (isChunkLoadError(event.reason)) {
      sawAssetError = true;
      recover();
    }
  });

  window.addEventListener("load", function () {
    // Cap waktu dibuang dari alamat supaya URL yang dibagikan atau di-bookmark
    // tetap rapi. Dijalankan bukan tepat saat "load" melainkan sesudahnya:
    // router Next masih menyetel ulang URL saat hidrasi dan akan mengembalikan
    // parameternya kalau dihapus terlalu cepat.
    setTimeout(function () {
      if (!new URL(location.href).searchParams.has(PARAM)) return;

      var clean = new URL(location.href);
      clean.searchParams.delete(PARAM);
      history.replaceState(history.state, "", clean.pathname + clean.search + clean.hash);
    }, 1500);

    // Tanda baru dilepas setelah halaman terbukti sehat sejenak. Peristiwa
    // "load" sendiri bukan bukti: pada kasus HTML basi halamannya tetap load
    // dengan sukses, hanya chunk-nya yang 404. Kalau tanda dilepas di situ,
    // deploy yang benar-benar kehilangan /_next/static akan memuat ulang
    // tanpa henti — jadi selama masih ada aset yang gagal, tanda dipertahankan
    // dan pemuatan ulang berhenti di percobaan pertama.
    setTimeout(function () {
      if (sawAssetError) return;

      try {
        sessionStorage.removeItem(FLAG);
      } catch (storageError) {}
    }, 5000);
  });
})();
`;

export default function StaleBuildRecovery() {
  return <script dangerouslySetInnerHTML={{ __html: RECOVERY_SCRIPT }} />;
}
