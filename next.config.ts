import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Phase 3 route consolidation (docs/ALPHASTREAM_UX_REDESIGN.md §Phase 3 /
  // Appendix): 22 routes merged into ~9. These redirects keep old
  // bookmarks/links working by sending them straight to the tab that now
  // holds that content, instead of 404ing.
  async redirects() {
    return [
      { source: "/overview", destination: "/today", permanent: true },

      { source: "/internals", destination: "/markets?tab=internals", permanent: true },
      { source: "/economic", destination: "/markets?tab=economic", permanent: true },
      { source: "/cta", destination: "/markets?tab=cta", permanent: true },

      { source: "/flow-map", destination: "/flows?tab=flow-map", permanent: true },
      { source: "/flow", destination: "/flows?tab=capital-flow", permanent: true },
      { source: "/sectors", destination: "/flows?tab=sectors", permanent: true },

      { source: "/recommendations", destination: "/ideas?tab=recommendations", permanent: true },
      { source: "/filter", destination: "/ideas?tab=filter", permanent: true },
      { source: "/screener", destination: "/ideas?tab=screener", permanent: true },
      { source: "/uptrend", destination: "/ideas?tab=uptrend", permanent: true },

      { source: "/collar", destination: "/futures", permanent: true },

      { source: "/charts", destination: "/ticker", permanent: true },
      { source: "/charts/:symbol", destination: "/ticker/:symbol?tab=chart", permanent: true },
    ];
  },
};

export default nextConfig;
