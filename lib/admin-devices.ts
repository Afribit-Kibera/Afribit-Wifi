export const MAX_ADMIN_DEVICES = 3;

export function isAdminDeviceSlot(slot: number) {
  return Number.isInteger(slot) && slot >= 1 && slot <= MAX_ADMIN_DEVICES;
}
