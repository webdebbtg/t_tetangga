import type { NextConfig } from "next";

const securityHeaders = [
  // Larang embedding di iframe dari domain lain (clickjacking protection)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // Jangan bocorkan referrer ke domain eksternal
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Larang browser menebak MIME type (MIME sniffing protection)
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Paksa HTTPS selama 1 tahun (aktif di production)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },

  // Batasi fitur browser yang sensitif
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },

  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' diperlukan Next.js untuk inline scripts (hydration).
      // 'unsafe-eval' DIHAPUS — tidak dibutuhkan Next.js production build.
      // Cloudflare Turnstile memerlukan script dari domain mereka.
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "img-src 'self' data: blob: http: https:",
      "font-src 'self'",
      // Izinkan Turnstile CAPTCHA + YouTube iframe background
      "frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://youtube.com",
      "connect-src 'self' http: https: https://challenges.cloudflare.com",
      "media-src 'self' blob: http: https:",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      // Google OAuth avatars
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      // Local dev
      { protocol: "http",  hostname: "localhost" },
      { protocol: "http",  hostname: "127.0.0.1" },
      // MinIO / S3 storage (dev)
      { protocol: "http",  hostname: "**", port: "9000", pathname: "/**" },
      // Production storage bucket
      { protocol: "https", hostname: "storage.tengoktetangga.bontangkota.go.id" },
    ],
  },
  async headers() {
    return [
      {
        // Terapkan ke semua route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
