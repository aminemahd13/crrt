import { assertImapConfigured } from "@/lib/mailbox/config";
import { ImapMailboxProvider } from "@/lib/mailbox/providers/imap-provider";
import { MockMailboxProvider } from "@/lib/mailbox/providers/mock-provider";
import type { MailboxProvider, MailboxResolvedConfig } from "@/lib/mailbox/types";

export function createMailboxProvider(config: MailboxResolvedConfig): MailboxProvider {
  if ((process.env.MAILBOX_PROVIDER ?? "").toLowerCase() === "mock") {
    return new MockMailboxProvider();
  }

  assertImapConfigured(config);
  return new ImapMailboxProvider({
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    user: config.imap.user,
    pass: config.imap.pass,
  });
}
