import { readFile } from "node:fs/promises";
import path from "node:path";

const RUFFLE_BASE_DIR = path.join(process.cwd(), "node_modules", "@ruffle-rs", "ruffle");

const CONTENT_TYPES: Record<string, string> = {
  ".js": "application/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const resolveContentType = (assetName: string) => {
  const extension = path.extname(assetName).toLowerCase();
  return CONTENT_TYPES[extension] ?? "application/octet-stream";
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ asset: string }> },
) {
  const { asset } = await params;

  if (!/^[a-zA-Z0-9._-]+$/.test(asset)) {
    return new Response("Invalid asset name.", { status: 400 });
  }

  const resolvedPath = path.resolve(RUFFLE_BASE_DIR, asset);

  if (!resolvedPath.startsWith(RUFFLE_BASE_DIR)) {
    return new Response("Invalid asset path.", { status: 400 });
  }

  try {
    const fileBuffer = await readFile(resolvedPath);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": resolveContentType(asset),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Asset not found.", { status: 404 });
  }
}
