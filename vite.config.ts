import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const localApiPlugin = (env: Record<string, string>): Plugin => ({
  name: 'yourbuddy-local-api',
  configureServer(server) {
    const serverEnvKeys = [
      'API_KEY',
      'GEMINI_API_KEY',
      'VITE_GEMINI_API_KEY',
      'QUOTA_DAILY_LIMIT',
      'QUOTA_PER_IP_DAILY_LIMIT',
      'QUOTA_PER_IP_MINUTE_LIMIT',
      'MAX_OUTPUT_TOKENS',
      'MAX_HISTORY_MESSAGES',
      'MAX_MESSAGE_CHARS',
      'MAX_IMAGE_BYTES',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'KV_REST_API_URL',
      'KV_REST_API_TOKEN'
    ];

    for (const key of serverEnvKeys) {
      if (!process.env[key] && env[key]) {
        process.env[key] = env[key];
      }
    }

    server.middlewares.use('/api/chat', async (req, res) => {
      try {
        const mod = await server.ssrLoadModule('/api/chat.ts');
        await mod.default(req, res);
      } catch (err) {
        console.error('Local /api/chat middleware error:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Local API middleware failed.' }));
        }
      }
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), localApiPlugin(env)]
  };
});
