import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zgrow Patient Manager',
    short_name: 'Zgrow Patient Manager',
    description: 'Patient Portal and Medical Records',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon1',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      }
    ],
  };
}
