import type { Instrumentation } from "next";

/**
 * Kode di layar error ("ERROR 1709229215") adalah digest yang dibuat Next dari
 * error aslinya. Pesan dan stack-nya sengaja tidak dikirim ke browser supaya
 * tidak bocor, jadi tanpa hook ini satu-satunya cara mencocokkan keluhan
 * pengunjung dengan penyebabnya adalah mengaduk stdout server.
 *
 * Masalahnya stdout proses Node di Hostinger lokasinya berbeda-beda tergantung
 * cara aplikasi dijalankan (Passenger, PM2, atau panel Node.js app), dan sering
 * tidak ketemu sama sekali. Jadi selain mencetak ke stdout, hook ini menulis
 * salinannya ke berkas tetap di dalam folder aplikasi: `logs/server-error.log`.
 * Lokasi itu selalu sama, apa pun cara deploy-nya.
 *
 * Penulisan berkasnya ada di instrumentation-log-file.ts, dipisah supaya
 * `node:fs` tidak ikut terbawa ke bundle Edge Runtime.
 */

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest)
      : "-";

  const detail =
    error instanceof Error ? error.stack || error.message : String(error);

  const entry = [
    "",
    "=== SERVER ERROR ===",
    `waktu     : ${new Date().toISOString()}`,
    `digest    : ${digest}`,
    `path      : ${request.method} ${request.path}`,
    `rute      : ${context.routePath} (${context.routeType}/${context.renderSource})`,
    `revalidate: ${context.revalidateReason ?? "-"}`,
    detail,
    "=== END SERVER ERROR ===",
    "",
  ].join("\n");

  console.error(entry);

  // Runtime edge tidak punya akses berkas; di sana cukup stdout.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { appendToLogFile } = await import("./instrumentation-log-file");
    await appendToLogFile(entry);
  }
};
