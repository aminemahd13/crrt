import { createHash, randomUUID } from "crypto";
import { convert } from "html-to-text";
import sanitizeHtml from "sanitize-html";
import type { MailboxAddress, OutgoingAttachmentInput } from "@/lib/mailbox/types";

export const OUTGOING_ATTACHMENT_MAX_TOTAL_BYTES = 25 * 1024 * 1024;

type ParserAddressValue = {
  name?: string;
  address?: string;
};

type ParserAddressObject = {
  value?: ParserAddressValue[];
};

export function normalizeMessageId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^<|>$/g, "").toLowerCase();
}

export function normalizeReferences(value: string[] | null | undefined): string[] {
  if (!value || value.length === 0) return [];
  return value
    .map((entry) => normalizeMessageId(entry))
    .filter((entry): entry is string => Boolean(entry));
}

export function normalizeSubject(subject: string | null | undefined): string {
  const normalized = (subject ?? "").trim();
  if (!normalized) return "";
  return normalized.replace(/^(re|fwd|fw)\s*:\s*/i, "").trim();
}

export function deriveThreadKey(input: {
  references: string[];
  inReplyTo: string | null;
  messageId: string | null;
  subject: string;
  date: Date;
  fromEmail: string | null;
}): string {
  if (input.references.length > 0) return input.references[0];
  if (input.inReplyTo) return input.inReplyTo;
  if (input.messageId) return input.messageId;
  const hash = createHash("sha1")
    .update(`${normalizeSubject(input.subject)}|${input.fromEmail ?? ""}|${input.date.toISOString().slice(0, 10)}`)
    .digest("hex");
  return `fallback-${hash}`;
}

export function toMailboxAddresses(addressObject: ParserAddressObject | null | undefined): MailboxAddress[] {
  const values = addressObject?.value ?? [];
  return values
    .map((entry) => ({
      name: entry.name?.trim() || null,
      address: entry.address?.trim().toLowerCase() ?? "",
    }))
    .filter((entry) => entry.address.length > 0);
}

export function pickPrimaryAddress(addresses: MailboxAddress[]): MailboxAddress | null {
  return addresses.length > 0 ? addresses[0] : null;
}

export function sanitizeHtmlBody(input: string | null | undefined): string | null {
  if (!input) return null;
  const sanitized = sanitizeHtml(input, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "span",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      span: ["style"],
      "*": ["style"],
    },
    allowedSchemes: ["http", "https", "mailto", "cid", "data"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
  return sanitized.trim() ? sanitized : null;
}

export function toTextFallback(htmlBody: string): string {
  return convert(htmlBody, {
    wordwrap: 120,
    selectors: [{ selector: "a", options: { hideLinkHrefIfSameAsText: true } }],
  });
}

export function toSnippet(textBody: string | null | undefined, htmlBody: string | null | undefined): string | null {
  const source = (textBody ?? "").trim() || (htmlBody ? toTextFallback(htmlBody).trim() : "");
  if (!source) return null;
  const compact = source.replace(/\s+/g, " ").trim();
  return compact.length > 220 ? `${compact.slice(0, 217)}...` : compact;
}

export function parseAttachmentInputs(
  input: OutgoingAttachmentInput[] | null | undefined
): Array<{ filename: string; mimeType: string; content: Buffer; size: number }> {
  const decodeBase64 = (payload: string): Buffer => {
    const normalized = payload.trim().replace(/\s+/g, "");
    if (!normalized) {
      throw new Error("Attachment content is empty.");
    }
    if (normalized.length % 4 !== 0 || !/^[A-Za-z0-9+/]+=*$/.test(normalized)) {
      throw new Error("Attachment content is not valid base64.");
    }
    const decoded = Buffer.from(normalized, "base64");
    if (!decoded.byteLength) {
      throw new Error("Attachment content could not be decoded.");
    }
    // Validate reversible decode to reject malformed payloads that Node may coerce.
    const left = normalized.replace(/=+$/g, "");
    const right = decoded.toString("base64").replace(/=+$/g, "");
    if (left !== right) {
      throw new Error("Attachment content failed integrity validation.");
    }
    return decoded;
  };

  const attachments = input ?? [];
  let total = 0;
  const result = attachments.map((attachment, index) => {
    const filename = attachment.filename?.trim() || `attachment-${index + 1}`;
    const mimeType = attachment.mimeType?.trim() || "application/octet-stream";
    const content = decodeBase64(attachment.contentBase64);
    const size = content.byteLength;
    total += size;
    return { filename, mimeType, content, size };
  });

  if (total > OUTGOING_ATTACHMENT_MAX_TOTAL_BYTES) {
    throw new Error("Attachment payload exceeds 25 MB total.");
  }

  return result;
}

export function generateMessageId(domain = "crrt.tech"): string {
  return `<${randomUUID()}@${domain}>`;
}

export function stringifyAddress(address: MailboxAddress): string {
  const safeName = (address.name ?? "").trim();
  if (!safeName) return address.address;
  return `${safeName} <${address.address}>`;
}

export function stringifyAddresses(addresses: MailboxAddress[]): string[] {
  return addresses.map((address) => stringifyAddress(address));
}

export function folderKeyToLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
