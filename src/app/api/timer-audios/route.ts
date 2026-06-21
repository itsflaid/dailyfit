import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac"]);

function toTitle(fileName: string) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const audioDir = path.join(process.cwd(), "public", "audio");

  try {
    const files = await readdir(audioDir, { withFileTypes: true });
    const audios = files
      .filter((file) => file.isFile())
      .filter((file) => AUDIO_EXTENSIONS.has(path.extname(file.name).toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((file) => ({
        fileName: file.name,
        name: toTitle(file.name) || file.name,
        src: `/audio/${encodeURIComponent(file.name)}`,
      }));

    return NextResponse.json({ audios });
  } catch {
    return NextResponse.json({ audios: [] });
  }
}
