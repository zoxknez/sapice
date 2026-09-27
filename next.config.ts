import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  {key: "X-Content-Type-Options", value: "nosniff"},
  {key: "Referrer-Policy", value: "strict-origin-when-cross-origin"},
  {key: "X-Frame-Options", value: "DENY"},
  {key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()"},
  {key: "Cross-Origin-Opener-Policy", value: "same-origin"},
  {key: "Cross-Origin-Resource-Policy", value: "same-origin"},
  {key: "X-DNS-Prefetch-Control", value: "off"},
  {key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains"}
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {key: "Cache-Control", value: "no-cache, no-store, must-revalidate"},
          {key: "Service-Worker-Allowed", value: "/"},
          ...securityHeaders
        ]
      },
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  }
};

export default withNextIntl(nextConfig);
