// Read-only JSON API for the journal. The list endpoint returns lightweight
// summaries; the detail endpoint returns the full article. Publishing happens
// only through the scheduler, never through HTTP.

import { Router } from 'express';
import { getPost, listPosts } from './store';

export function blogRouter(): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const posts = await listPosts();
    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=600').json({
      count: posts.length,
      posts: posts.map(({ body, ...meta }) => meta),
    });
  });

  router.get('/:slug', async (req, res) => {
    const post = await getPost(req.params.slug);
    if (!post) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=600').json(post);
  });

  return router;
}
