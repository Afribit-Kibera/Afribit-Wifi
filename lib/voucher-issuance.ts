import { decryptVoucherCode, encryptVoucherCode, generateVoucherCode, hashLegacyVoucherCode, hashVoucherCode } from "./voucher-crypto";

export function prepareVoucherRecords(batchId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) throw new Error("Invalid voucher quantity");
  const codes = new Set<string>();
  while (codes.size < quantity) codes.add(generateVoucherCode());
  return Array.from(codes, code => ({ batchId, codeHash: hashVoucherCode(code),
    // Four exposed digits would leave only 100 guesses for a numeric ticket
    // after a DB leak. Full codes remain available only in authorized exports.
    codeCiphertext: encryptVoucherCode(code), codeLastFour: "" }));
}

export function isVoucherCollision(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: string; constraint?: string; message?: string; cause?: unknown };
  return (value.code === "23505" && (value.constraint === "vouchers_code_hash_uidx" ||
    value.message?.includes("vouchers_code_hash_uidx") === true)) ||
    (value.cause !== undefined && value.cause !== error && isVoucherCollision(value.cause));
}

/** The callback must issue the batch and its codes in ONE database transaction. */
export async function issueVoucherBatch<T>(batchId: string, quantity: number,
  insertAtomic: (records: ReturnType<typeof prepareVoucherRecords>) => Promise<T>,
  findOccupied?: (hashes: string[]) => Promise<string[]>) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const records = new Map<string, ReturnType<typeof prepareVoucherRecords>[number]>();
    for (let fill = 0; records.size < quantity && fill < 100; fill++) {
      const candidates = prepareVoucherRecords(batchId, quantity - records.size);
      // Reserve against all historic plaintext hashes, including retired stock:
      // a newly sold code must never collide with an older physical ticket.
      const legacyHashes = candidates.map(record => hashLegacyVoucherCode(decryptVoucherCode(record.codeCiphertext)));
      const occupied = new Set(findOccupied ? await findOccupied([...candidates.map(record => record.codeHash), ...legacyHashes]) : []);
      for (const [index, record] of candidates.entries()) if (!occupied.has(record.codeHash) && !occupied.has(legacyHashes[index])) records.set(record.codeHash, record);
    }
    if (records.size !== quantity) throw new Error("Not enough unused voucher codes. Try a smaller batch.");
    try { return await insertAtomic(Array.from(records.values())); }
    catch (error) { if (!isVoucherCollision(error)) throw error; }
  }
  throw new Error("Could not reserve unique voucher codes. Try a smaller batch.");
}
