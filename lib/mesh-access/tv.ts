// Smart-TV browsers, by their user agent. A TV gets a screen built for a remote:
// a big code the household's phone scans to pay, instead of a phone checkout.
// A miss is harmless: the TV screen always offers "Buy on this TV" too.
const tvAgents = /\b(VIDAA|SMART-TV|SmartTV|Tizen|Web0S|webOS|NetCast|HbbTV|BRAVIA|Android ?TV|GoogleTV|Chromecast|AFT[A-Z]{1,4}|CrKey|Roku|AppleTV|Opera TV|TV Safari|PhilipsTV|NETTV|Viera|MIBOX)\b/i;

export function isTvBrowser(userAgent: string | null | undefined) {
  return tvAgents.test(userAgent ?? "");
}
