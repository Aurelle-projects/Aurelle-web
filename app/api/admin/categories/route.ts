import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { AURELLE_CATEGORIES } from "@/lib/categories/data";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CATEGORIES_FILE)) {
    const initial = AURELLE_CATEGORIES.map((c) => ({
      id: c.slug,
      name: c.name,
      slug: c.slug,
      description: c.description,
      sort_order: c.sort_order,
      image_url: null,
      image_public_id: null,
    }));
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export async function GET() {
  try {
    ensureFile();
    const raw = fs.readFileSync(CATEGORIES_FILE, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ success: true, categories: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureFile();
    const body = await req.json();

    // If single category update: { slug, image_url, image_public_id }
    if (body.slug) {
      const raw = fs.readFileSync(CATEGORIES_FILE, "utf-8");
      const current = JSON.parse(raw);
      const updated = current.map((c: { slug: string }) =>
        c.slug === body.slug
          ? {
              ...c,
              image_url: body.image_url ?? null,
              image_public_id: body.image_public_id ?? null,
            }
          : c
      );
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(updated, null, 2), "utf-8");
      return NextResponse.json({ success: true, categories: updated });
    }

    // If full array update: { categories: [...] }
    if (Array.isArray(body.categories)) {
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(body.categories, null, 2), "utf-8");
      return NextResponse.json({ success: true, categories: body.categories });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
