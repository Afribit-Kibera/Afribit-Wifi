export class RequestBodyError extends Error {
  constructor(readonly status: 400 | 413) {
    super(status === 413 ? "Request body too large" : "Invalid request body");
  }
}

// Count bytes as they arrive. Content-Length is optional and cannot protect
// against an oversized chunked request; never buffer the entire request first.
export async function readBoundedText(request: Request, maxBytes: number): Promise<string> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error("Invalid body limit");
  const length = request.headers.get("content-length");
  if (length !== null) {
    if (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length))) throw new RequestBodyError(400);
    if (Number(length) > maxBytes) {
      await request.body?.cancel().catch(() => undefined);
      throw new RequestBodyError(413);
    }
  }
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new RequestBodyError(413);
      }
      chunks.push(value);
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks, bytes));
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError(400);
  } finally {
    reader.releaseLock();
  }
}

export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
  const text = await readBoundedText(request, maxBytes);
  try { return JSON.parse(text); }
  catch { throw new RequestBodyError(400); }
}
