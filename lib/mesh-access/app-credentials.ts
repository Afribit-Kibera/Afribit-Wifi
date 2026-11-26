// The Afribit app holds the same two secrets a browser keeps in cookies: the
// router-attested Mesh session and this phone's device key. It sends them as
// headers instead. A cookie always wins when present, so the web flow is
// unchanged. Custom headers can't be sent cross-site without a CORS preflight,
// which these routes never grant, so a web page can't use this path.
export const meshSessionHeader = "x-afribit-mesh-session";
export const meshDeviceHeader = "x-afribit-mesh-device";

export function readCookie(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

/** The cookie value if there is one, otherwise the app's header. Never both. */
export function readCredential(request: Request, cookieName: string, headerName: string) {
  const cookie = readCookie(request, cookieName);
  if (cookie !== undefined) return cookie;
  return request.headers.get(headerName)?.trim() || undefined;
}
