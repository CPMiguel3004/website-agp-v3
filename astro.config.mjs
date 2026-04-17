import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://academiadeguitarradoporto.pt',
  integrations: [
    tailwind({ applyBaseStyles: false }),
  ],
  output: 'static',
});
