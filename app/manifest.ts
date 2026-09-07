import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "INSTA-FLOAN",
    short_name: "INSTA-FLOAN",
    description: "Instadapp-oriented flash-loan arbitrage control plane",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    icons: [],
  };
}
