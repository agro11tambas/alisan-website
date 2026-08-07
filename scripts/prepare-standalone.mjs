import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nextDirectory = join(projectRoot, ".next");
const standaloneDirectory = join(nextDirectory, "standalone");

if (!existsSync(join(standaloneDirectory, "server.js"))) {
  throw new Error(
    "Standalone server was not generated. Keep output: \"standalone\" enabled in next.config.ts.",
  );
}

function listFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);

    return entry.isDirectory() ? listFiles(absolutePath) : [absolutePath];
  });
}

function copyDirectory(source, destination, label) {
  if (!existsSync(source)) {
    throw new Error(`Required ${label} directory is missing: ${source}`);
  }

  rmSync(destination, { force: true, recursive: true });
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });

  const sourceFiles = listFiles(source);
  const missingFiles = sourceFiles.filter((sourceFile) => {
    const destinationFile = join(destination, relative(source, sourceFile));

    return (
      !existsSync(destinationFile) ||
      statSync(sourceFile).size !== statSync(destinationFile).size
    );
  });

  if (missingFiles.length > 0) {
    throw new Error(
      `${label} packaging failed. Missing or incomplete files: ${missingFiles
        .slice(0, 5)
        .map((file) => relative(projectRoot, file))
        .join(", ")}`,
    );
  }

  return sourceFiles.length;
}

const staticSource = join(nextDirectory, "static");
const staticDestination = join(standaloneDirectory, ".next", "static");
const publicSource = join(projectRoot, "public");
const publicDestination = join(standaloneDirectory, "public");

const staticFileCount = copyDirectory(
  staticSource,
  staticDestination,
  "Next.js static assets",
);
const publicFileCount = copyDirectory(
  publicSource,
  publicDestination,
  "public assets",
);

const cssFiles = listFiles(staticDestination).filter((file) =>
  file.endsWith(".css"),
);

if (cssFiles.length === 0) {
  throw new Error(
    "Standalone package contains no CSS files. Refusing to produce a broken deployment.",
  );
}

// Next's file tracing copies sharp's `.node` binary but misses the shared
// libraries it links against (libvips-42.dll on Windows, *.so.* on Linux).
// Without them sharp fails to load and the image optimizer silently falls back
// to serving the original file, which is what `unoptimized: true` used to hide.
const imgSource = join(projectRoot, "node_modules", "@img");
const imgDestination = join(standaloneDirectory, "node_modules", "@img");

if (!existsSync(imgSource)) {
  throw new Error(
    "sharp's @img packages are missing from node_modules. Run `npm install --include=optional sharp`.",
  );
}

const nativeFileCount = copyDirectory(
  imgSource,
  imgDestination,
  "sharp native binaries",
);

// Loading sharp is the only reliable proof the binaries are complete.
const sharpEntry = join(standaloneDirectory, "node_modules", "sharp", "dist", "sharp.cjs");

if (existsSync(sharpEntry)) {
  const { createRequire } = await import("node:module");
  const requireFromStandalone = createRequire(sharpEntry);

  try {
    requireFromStandalone(sharpEntry);
  } catch (error) {
    throw new Error(
      `Standalone package cannot load sharp, so images would be served unoptimized:\n${error.message}`,
    );
  }
}

console.log(
  `Standalone package ready: ${staticFileCount} Next.js assets (${cssFiles.length} CSS), ${publicFileCount} public assets and ${nativeFileCount} sharp native files.`,
);
