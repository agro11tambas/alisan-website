/**
 * Bagian penulisan berkas dari instrumentation.ts. Dipisah ke file sendiri
 * karena instrumentation.ts ikut di-bundle untuk Edge Runtime, dan di sana
 * `node:fs`/`node:path`/`process.cwd` memicu peringatan bundler walaupun
 * kodenya tidak pernah dijalankan. File ini hanya di-import secara dinamis
 * saat NEXT_RUNTIME === "nodejs".
 */
import { appendFile, mkdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

const LOG_DIRECTORY = "logs";
const LOG_FILE = "server-error.log";

/**
 * Log dibiarkan tumbuh sampai batas ini lalu file lama ditimpa, supaya kuota
 * shared hosting tidak habis kalau ada error yang terjadi berulang kali.
 */
const MAX_LOG_BYTES = 5 * 1024 * 1024;

export const appendToLogFile = async (entry: string) => {
  try {
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
