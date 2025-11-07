import { z } from "zod";

const signatureEnv = z.object({
  MATRIX_BASE_URL: z.string().url(),
  MATRIX_ACCESS_TOKEN: z.string(),
  MATRIX_USER_ID: z.string()
});

const signatureConfig = signatureEnv.safeParse({
  MATRIX_BASE_URL: process.env.WEBMAIL_MATRIX_BASE_URL || process.env.MATRIX_BASE_URL || "",
  MATRIX_ACCESS_TOKEN: process.env.WEBMAIL_MATRIX_ACCESS_TOKEN || process.env.MATRIX_ACCESS_TOKEN || "",
  MATRIX_USER_ID: process.env.WEBMAIL_MATRIX_USER_ID || process.env.MATRIX_USER_ID || ""
});

export type Signature = {
  id: string;
  name: string;
  html: string;
  default?: boolean;
};

const STORAGE_EVENT = "org.mailiacreate.webmail.signatures";

export async function listSignatures(): Promise<Signature[]> {
  if (!signatureConfig.success) return [];
  const res = await fetch(
    `${signatureConfig.data.MATRIX_BASE_URL}/_matrix/client/v3/user/${encodeURIComponent(signatureConfig.data.MATRIX_USER_ID)}/account_data/${encodeURIComponent(STORAGE_EVENT)}`,
    {
      headers: {
        Authorization: `Bearer ${signatureConfig.data.MATRIX_ACCESS_TOKEN}`
      }
    }
  );
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return z
    .object({ signatures: z.array(z.object({ id: z.string(), name: z.string(), html: z.string(), default: z.boolean().optional() })) })
    .safeParse(data).data?.signatures ?? [];
}

export async function saveSignatures(signatures: Signature[]) {
  if (!signatureConfig.success) {
    throw new Error("Matrix account data no configurada");
  }
  const res = await fetch(
    `${signatureConfig.data.MATRIX_BASE_URL}/_matrix/client/v3/user/${encodeURIComponent(signatureConfig.data.MATRIX_USER_ID)}/account_data/${encodeURIComponent(STORAGE_EVENT)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${signatureConfig.data.MATRIX_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ signatures })
    }
  );
  if (!res.ok) {
    throw new Error(`No se pudieron persistir las firmas (${res.status})`);
  }
}
