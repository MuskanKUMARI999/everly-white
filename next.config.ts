import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The invoice route reads the EB Garamond file off disk at request time to
  // embed it in the PDF. Nothing imports that file, so Next's dependency
  // tracing cannot see it and would leave it out of the deployed function —
  // the route would then fall back to a built-in font, which has no glyph for
  // the rupee sign and silently renders it as a superscript one. Naming it here
  // keeps it in the bundle.
  outputFileTracingIncludes: {
    "/api/invoices/[orderNumber]": [
      "./public/fonts/EBGaramond.ttf",
      "./public/images/invoice-logo.png",
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
