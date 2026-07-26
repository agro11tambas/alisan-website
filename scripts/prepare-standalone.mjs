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

console.log(
  `Standalone package ready: ${staticFileCount} Next.js assets (${cssFiles.length} CSS) and ${publicFileCount} public assets.`,
);
