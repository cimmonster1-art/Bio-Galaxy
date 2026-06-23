// Daily autopublishing for the journal. Once per day, at a time that is
// randomized within the day, the scheduler asks Gemini for a fresh article,
// sanitizes it, runs it through quality control against everything already
// published, and stores it with its own date and time. If the key is absent the
// scheduler stays idle and the journal simply serves whatever is already stored.

import { generateArticle, isConfigured } from './gemini';
import { assess, sanitize } from './quality';
import { addPost, listPosts, readingMinutes, toSlug, type BlogPost } from './store';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 4;

let timer: NodeJS.Timeout | undefined;

/** Whole milliseconds until a uniformly random moment within the next day. */
function nextDelay(): number {
  // Spread the post somewhere in the next 24 hours so the time differs daily.
  return Math.floor(6 * 60 * 60 * 1000 + Math.random() * (DAY_MS - 6 * 60 * 60 * 1000));
}

/**
 * Generate, vet, and store one article. Retries with fresh prompts until a draft
 * clears quality control or the attempt budget is exhausted. Returns the stored
 * post, or null when nothing acceptable could be produced.
 */
export async function generateAndPublish(): Promise<BlogPost | null> {
  const existing = await listPosts();
  const titles = existing.map((p) => p.title);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const draft = await generateArticle(titles, Date.now() + attempt);
      const title = sanitize(draft.title);
      const body = sanitize(draft.body);
      const summary = sanitize(draft.summary);
      const verdict = assess({ title, body }, existing);
      if (!verdict.ok) {
        console.warn(`[blog] draft rejected (attempt ${attempt}): ${verdict.reasons.join('; ')}`);
        continue;
      }
      const slug = toSlug(title, new Set(existing.map((p) => p.slug)));
      const post: BlogPost = {
        slug,
        title,
        summary,
        body,
        tags: draft.tags.map((t) => sanitize(t)).filter(Boolean).slice(0, 6),
        createdAt: new Date().toISOString(),
        author: 'Bio Galaxy Editorial',
        generator: `gemini:${process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'}`,
        readingMinutes: readingMinutes(body),
      };
      await addPost(post);
      console.log(`[blog] published "${post.title}" at ${post.createdAt}`);
      return post;
    } catch (error) {
      console.warn(`[blog] generation attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
    }
  }
  console.warn('[blog] no acceptable article produced this cycle');
  return null;
}

/** Schedule the next post, then reschedule itself for the following day. */
function scheduleNext(): void {
  const delay = nextDelay();
  const when = new Date(Date.now() + delay);
  console.log(`[blog] next article scheduled for ${when.toISOString()}`);
  timer = setTimeout(() => {
    void generateAndPublish().finally(scheduleNext);
  }, delay);
  timer.unref?.();
}

/**
 * Start the daily scheduler. No-op when no Gemini key is configured. If the most
 * recent post is more than a day old (or none exists), one is generated shortly
 * after startup so a freshly deployed instance is not left empty.
 */
export function startBlogScheduler(): void {
  if (timer) return;
  if (!isConfigured()) {
    console.log('[blog] GEMINI_API_KEY not set; autopublishing disabled, serving stored posts only');
    return;
  }

  void (async () => {
    const posts = await listPosts();
    const newest = posts[0]?.createdAt ? new Date(posts[0].createdAt).getTime() : 0;
    if (Date.now() - newest > DAY_MS) {
      const warmup = setTimeout(() => void generateAndPublish(), 30_000);
      warmup.unref?.();
    }
    scheduleNext();
  })();
}
