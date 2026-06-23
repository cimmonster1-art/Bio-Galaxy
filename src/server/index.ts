import { createApp } from './app';
import { startBlogScheduler } from './blog/scheduler';

// Single executable entry point for the atlas host and its allowlisted,
// cached gateway to public science APIs.
const PORT = Number(process.env.PORT ?? 3000);

createApp()
  .then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Bio Galaxy atlas running at http://localhost:${PORT}`);
      // Begin daily journal autopublishing when a Gemini key is configured.
      startBlogScheduler();
    });
  })
  .catch((error: unknown) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
