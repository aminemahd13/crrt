declare module "mailparser" {
  interface AddressValue {
    name?: string;
    address?: string;
  }

  interface AddressObject {
    value?: AddressValue[];
  }

  interface ParsedAttachment {
    filename?: string;
    contentType?: string;
    size?: number;
    contentId?: string | null;
    contentDisposition?: string | null;
    transferEncoding?: string | null;
    content: Buffer;
  }

  export interface ParsedMail {
    to?: AddressObject | null;
    cc?: AddressObject | null;
    bcc?: AddressObject | null;
    from?: AddressObject | null;
    messageId?: string | null;
    inReplyTo?: string | null;
    references?: string[] | string | null;
    subject?: string | null;
    html?: string | Buffer | null;
    text?: string | null;
    date?: Date | null;
    attachments: ParsedAttachment[];
  }

  export function simpleParser(source: Buffer | string): Promise<ParsedMail>;
}
