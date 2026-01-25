import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FMC APP - Admin Panel',
    short_name: 'FMC APP',
    description: "Interface d'administration pour FMC APP - Premium Medical Learning",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
