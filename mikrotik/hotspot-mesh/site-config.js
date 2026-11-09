/*
 * Configure one copy per access router before commissioning.
 * No credentials or API keys belong in this public file.
 * Leave capabilities false until the router policy and service are verified.
 * Unique router IDs need backend job targeting before a second paid access node.
 */
window.MESH_SITE = Object.freeze({
  locationLabel: "Kibera",
  routerId: "",
  billingReady: false,
  // Set https://mesh-core.afribit.africa/start only after guest-only TLS
  // onboarding is commissioned on the enrolled Primary. Never use HTTP.
  automaticJoinUrl: "",
});
