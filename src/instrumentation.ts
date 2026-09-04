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
 */

const LOG_DIRECTORY = "logs";
const LOG_FILE = "server-error.log";

/**
 * Log dibiarkan tumbuh sampai batas ini lalu file lama ditimpa, supaya kuota
 * shared hosting tidak habis kalau ada error yang terjadi berulang kali.
 */
const MAX_LOG_BYTES = 5 * 1024 * 1024;

const appendToLogFile = async (entry: string) => {
  // Runtime edge tidak punya akses berkas; di sana cukup stdout.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { appendFile, mkdir, stat, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");

    const directory = join(process.cwd(), LOG_DIRECTORY);
    const file = join(directory, LOG_FILE);

    await mkdir(directory, { recursive: true });

    try {
      const { size } = await stat(file);
      if (size > MAX_LOG_BYTES) await rm(file, { force: true });
    } catch {
      // Berkas belum ada — tidak apa-apa, appendFile yang membuatnya.
    }

    await appendFile(file, entry, "utf8");
  } catch (writeError) {
    // Menulis log tidak boleh menjadi sumber error baru; cukup laporkan sekali.
    console.error("[instrumentation] gagal menulis log error:", writeError);
  }
};

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

  await appendToLogFile(entry);
};
