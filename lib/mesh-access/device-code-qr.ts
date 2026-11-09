import QRCode from "qrcode";

// The QR a payer scans: it opens Mesh on their phone with the device code filled in.
export function deviceCodeQr(code: string) {
  return QRCode.toString(`https://wifi.afribit.africa/?device=${code}`, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#203c32", light: "#ffffff" } });
}
