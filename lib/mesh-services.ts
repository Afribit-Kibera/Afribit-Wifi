// Publish only destinations the operator has deliberately configured for this site.
// Default cloud deployment must not advertise private addresses from a developer's lab.
export type MeshService = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: "local" | "internet";
  label?: string;
};

function serviceUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export function getMeshServices(): MeshService[] {
  const candidates = [
    { id: "community", title: "Community board", description: "Notes and conversations from people on Mesh.", href: serviceUrl(process.env.MESH_LOCAL_BOARD_URL), category: "local" as const, label: "On the mesh" },
    { id: "media", title: "Shared media", description: "Discover the collection hosted by your community.", href: serviceUrl(process.env.MESH_LOCAL_MEDIA_URL), category: "local" as const, label: "On the mesh" },
    { id: "learning", title: "Learning library", description: "Resources to learn something new, close to home.", href: serviceUrl(process.env.MESH_LOCAL_LEARNING_URL), category: "local" as const, label: "On the mesh" },
  ];
  return candidates.flatMap((service) => service.href ? [{ ...service, href: service.href }] : []);
}

export function getBlinkAccess(): "pending" | "enabled" {
  return process.env.MESH_BLINK_FREE_ACCESS_ENABLED === "true" ? "enabled" : "pending";
}
