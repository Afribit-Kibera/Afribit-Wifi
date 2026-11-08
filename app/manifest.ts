import type { MetadataRoute } from "next";

// Installs Mesh on the home screen as its own app window.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mesh by Afribit",
    short_name: "Mesh",
    description: "Community Wi-Fi in Kibera: free learning and apps, internet passes, and your pass on every device.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffaf2",
    theme_color: "#203c32",
    categories: ["education", "utilities"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My pass", url: "/pass", description: "Pass code, time left and devices" },
      { name: "Get internet", url: "/?view=internet" },
    ],
  };
}
