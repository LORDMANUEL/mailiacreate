import { z } from "zod";

const envSchema = z.object({
  JMAP_BASE_URL: z.string().url(),
  JMAP_USERNAME: z.string(),
  JMAP_PASSWORD: z.string()
});

const parsed = envSchema.safeParse({
  JMAP_BASE_URL: process.env.WEBMAIL_JMAP_BASE_URL || process.env.JMAP_BASE_URL || "",
  JMAP_USERNAME: process.env.WEBMAIL_JMAP_USERNAME || process.env.JMAP_USERNAME || "",
  JMAP_PASSWORD: process.env.WEBMAIL_JMAP_PASSWORD || process.env.JMAP_PASSWORD || ""
});

if (!parsed.success) {
  console.warn("Configuración JMAP incompleta: ", parsed.error.flatten());
}

export type Mailbox = {
  id: string;
  name: string;
  totalEmails: number;
};

export type MessageSummary = {
  id: string;
  subject: string;
  from: string;
  preview: string;
  receivedAt: string;
  mailboxId: string;
};

export type MessageDetail = {
  id: string;
  subject: string;
  from: string;
  to: string;
  htmlBody?: string;
  textBody?: string;
  receivedAt: string;
  labels: string[];
};

async function jmapRequest<T>(body: unknown): Promise<T> {
  if (!parsed.success) {
    throw new Error("El servidor webmail no tiene variables JMAP configuradas");
  }
  const response = await fetch(`${parsed.data.JMAP_BASE_URL}/jmap`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${parsed.data.JMAP_USERNAME}:${parsed.data.JMAP_PASSWORD}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Error JMAP ${response.status}`);
  }
  return response.json();
}

type JMAPResponse = {
  methodResponses: [
    [
      string,
      {
        list?: Array<any>;
        state?: string;
      },
      string
    ]
  ];
};

export async function listMailboxes(): Promise<Mailbox[]> {
  const body = {
    using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
    methodCalls: [["Mailbox/get", { accountId: "urn:ietf:params:jmap:accountId:primary" }, "a"]]
  };
  const result = await jmapRequest<JMAPResponse>(body);
  const [, payload] = result.methodResponses[0];
  return (
    payload.list || []
  ).map((item: any) => ({
    id: item.id,
    name: item.name,
    totalEmails: item.totalEmails ?? item.totalMessages ?? 0
  }));
}

export async function listMessages(mailboxId: string): Promise<MessageSummary[]> {
  const body = {
    using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
    methodCalls: [
      [
        "Email/query",
        {
          accountId: "urn:ietf:params:jmap:accountId:primary",
          filter: { mailboxIds: { [mailboxId]: true } },
          sort: [{ property: "receivedAt", isAscending: false }],
          limit: 25
        },
        "q"
      ],
      [
        "Email/get",
        {
          accountId: "urn:ietf:params:jmap:accountId:primary",
          properties: ["id", "subject", "from", "preview", "receivedAt", "mailboxIds"],
          ids: { resultOf: "q", name: "Email/query", path: "ids" }
        },
        "g"
      ]
    ]
  };
  const result = await jmapRequest<JMAPResponse>(body);
  const emailGet = result.methodResponses.find(([name]) => name === "Email/get");
  const [, payload] = emailGet || [];
  return (
    payload?.list || []
  ).map((item: any) => ({
    id: item.id,
    subject: item.subject || "(sin asunto)",
    from: item.from?.[0]?.email ?? "",
    preview: item.preview ?? "",
    receivedAt: item.receivedAt,
    mailboxId: Object.keys(item.mailboxIds || {})[0] ?? mailboxId
  }));
}

export async function getMessage(messageId: string): Promise<MessageDetail | null> {
  const body = {
    using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
    methodCalls: [
      [
        "Email/get",
        {
          accountId: "urn:ietf:params:jmap:accountId:primary",
          ids: [messageId],
          properties: ["id", "subject", "from", "to", "receivedAt", "keywords"],
          bodyProperties: ["textBody", "htmlBody"],
          fetchHTMLBodyValues: true,
          fetchTextBodyValues: true
        },
        "g"
      ]
    ]
  };
  const result = await jmapRequest<JMAPResponse>(body);
  const [, payload] = result.methodResponses[0];
  const email = payload.list?.[0];
  if (!email) return null;
  return {
    id: email.id,
    subject: email.subject || "(sin asunto)",
    from: email.from?.[0]?.email ?? "",
    to: email.to?.map((p: any) => p.email).join(", ") ?? "",
    htmlBody: email.htmlBody?.[0]?.value,
    textBody: email.textBody?.[0]?.value,
    receivedAt: email.receivedAt,
    labels: Object.keys(email.keywords || {})
  };
}
