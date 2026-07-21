import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // The live domain. academiadeguitarradoporto.pt was configured here for a long
  // time but has never existed — it does not resolve in DNS — which pointed every
  // canonical, og:url and sitemap entry at a dead host. Non-www 308s to www, so
  // www is the canonical form.
  site: 'https://www.academiaguitarraporto.pt',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  output: 'static',
});
