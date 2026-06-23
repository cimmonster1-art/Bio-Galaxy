// Persistent store for the Bio Galaxy journal. Posts are kept as a single JSON
// document on disk so the catalogue survives restarts and can be committed as a
// seed. Each record carries its own creation date and time. This is the seam
// where a real database can be swapped in later without touching the routes,
// scheduler, or UI.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface BlogPost {
  /** URL-safe identifier, derived from the title. */
  slug: string;
  title: string;
  summary: string;
  /** Plain paragraphs separated by blank lines. No markdown headings. */
  body: string;
  tags: string[];
  /** ISO-8601 creation timestamp, with both date and time. */
  createdAt: string;
  author: string;
  /** Provenance of the text: "seed" or "gemini:<model>". */
  generator: string;
  readingMinutes: number;
}

const DIR = path.join(process.cwd(), 'content', 'blog');
const FILE = path.join(DIR, 'posts.json');

/** All posts, newest first. Returns an empty list when nothing is stored yet. */
export async function listPosts(): Promise<BlogPost[]> {
  try {
    const raw = await readFile(FILE, 'utf8');
    const posts = JSON.parse(raw) as BlogPost[];
    return [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

/** A single post by slug, or undefined when it does not exist. */
export async function getPost(slug: string): Promise<BlogPost | undefined> {
  const posts = await listPosts();
  return posts.find((p) => p.slug === slug);
}

/** Persist the full post list, creating the content directory if needed. */
export async function savePosts(posts: BlogPost[]): Promise<void> {
  await mkdir(DIR, { recursive: true });
  await writeFile(FILE, `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
}

/** Append one post, returning the updated list (newest first). */
export async function addPost(post: BlogPost): Promise<BlogPost[]> {
  const posts = await listPosts();
  posts.unshift(post);
  await savePosts(posts);
  return posts;
}

/** A URL-safe slug from a title, kept unique against existing slugs. */
export function toSlug(title: string, existing: ReadonlySet<string> = new Set()): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 72) || 'post';
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** Estimated reading time in whole minutes, at ~200 words per minute. */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
