"use client";

import {
  type ClipboardEvent as ReactClipboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  Archive,
  ArrowLeft,
  CornerDownLeft,
  Download,
  FilePlus2,
  MailPlus,
  RefreshCcw,
  Reply,
  ReplyAll,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";

const OUTGOING_ATTACHMENT_MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const DEFAULT_POLL_SECONDS = 30;
const AUTO_SAVE_DRAFT_DELAY_MS = 1500;

const FOLDERS = [
  { key: "inbox", label: "Inbox" },
  { key: "sent", label: "Sent" },
  { key: "drafts", label: "Drafts" },
  { key: "archive", label: "Archive" },
  { key: "trash", label: "Trash" },
] as const;

type FolderKey = (typeof FOLDERS)[number]["key"];

type MailAddress = {
  name?: string | null;
  address?: string | null;
  email?: string | null;
};

type ThreadItem = {
  threadId: string;
  latestMessageId: string;
  subject: string;
  snippet: string | null;
  from: { name: string | null; email: string | null };
  date: string;
  unreadCount: number;
  hasAttachments: boolean;
  folderKey: FolderKey;
};

type MessageAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  isInline: boolean;
};

type ThreadMessage = {
  id: string;
  threadId: string;
  messageIdHeader: string | null;
  inReplyTo: string | null;
  references: unknown;
  folder: string;
  from: { name: string | null; email: string | null };
  to: unknown;
  cc: unknown;
  bcc: unknown;
  subject: string;
  snippet: string | null;
  textBody: string | null;
  htmlBody: string | null;
  date: string;
  isRead: boolean;
  isFlagged: boolean;
  direction: "inbound" | "outbound";
  attachments: MessageAttachment[];
};

type DraftListItem = {
  id: string;
  threadId: string | null;
  subject: string;
  updatedAt: string;
  to: MailAddress[];
  attachmentCount: number;
  version: number;
  status: string;
};

type DraftAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  contentBase64?: string;
};

type DraftDetail = {
  id: string;
  threadId: string | null;
  to: MailAddress[];
  cc: MailAddress[];
  bcc: MailAddress[];
  subject: string;
  htmlBody: string;
  textBody: string;
  version: number;
  status: string;
  lastError: string | null;
  updatedAt: string;
  createdAt: string;
  attachments: DraftAttachment[];
};

type MailboxStatus = {
  mailbox: string;
  syncIntervalSeconds: number;
  initialSyncDays: number;
  folders: Record<FolderKey, string>;
  hasSmtpSecrets: boolean;
  hasImapSecrets: boolean;
  cursors: Array<{
    folderKey: string;
    folderName: string;
    highestUid: number | null;
    uidValidity: string | null;
    syncStatus: string;
    lastSyncedAt: string | null;
    lastError: string | null;
  }>;
};

type ComposerAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  contentBase64: string;
};

type ComposerMode = "new" | "reply" | "reply_all" | "draft";

type ComposerState = {
  open: boolean;
  mode: ComposerMode;
  sourceMessageId: string | null;
  draftId: string | null;
  draftVersion: number | null;
  threadId: string | null;
  toInput: string;
  ccInput: string;
  bccInput: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  attachments: ComposerAttachment[];
};

type ComposerRecipientField = "toInput" | "ccInput" | "bccInput";

type ParsedComposerAddress = {
  name: string | null;
  address: string;
};

type ParsedComposerAddressInput = {
  valid: ParsedComposerAddress[];
  invalid: string[];
};

type DraftSavePayload = {
  threadId: string | null;
  to: ParsedComposerAddress[];
  cc: ParsedComposerAddress[];
  bcc: ParsedComposerAddress[];
  subject: string;
  htmlBody: string;
  textBody: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    contentBase64: string;
  }>;
};

function parseAddressList(input: unknown): MailAddress[] {
  if (!Array.isArray(input)) return [];
  const parsed: MailAddress[] = [];
  for (const value of input) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    const address = typeof item.address === "string"
      ? item.address
      : typeof item.email === "string"
        ? item.email
        : "";
    if (!address.trim()) continue;
    parsed.push({
      name: typeof item.name === "string" ? item.name : null,
      address: address.trim().toLowerCase(),
    });
  }
  return parsed;
}

function stringifyAddressList(addresses: MailAddress[]): string {
  return addresses
    .map((entry) => {
      const address = (entry.address || entry.email || "").trim();
      if (!address) return "";
      const name = entry.name?.trim();
      return name ? `${name} <${address}>` : address;
    })
    .filter(Boolean)
    .join(", ");
}

function formatAddressDisplay(
  entry: { name?: string | null; address?: string | null; email?: string | null } | null | undefined,
  fallback = "Unknown sender"
): string {
  if (!entry) return fallback;
  const name = entry.name?.trim() || "";
  const address = (entry.address || entry.email || "").trim();
  if (name && address) return `${name} <${address}>`;
  if (address) return address;
  if (name) return name;
  return fallback;
}

function parseComposerAddressInput(value: string): ParsedComposerAddressInput {
  const valid: ParsedComposerAddress[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  const normalizedValue = value
    .replace(/\r\n/g, "\n")
    .replace(/\t+/g, ";")
    .trim();
  if (!normalizedValue) {
    return { valid, invalid };
  }

  const addValid = (name: string | null, address: string) => {
    const normalizedAddress = address.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedAddress)) return;
    if (seen.has(normalizedAddress)) return;
    seen.add(normalizedAddress);
    valid.push({
      name: name?.trim() || null,
      address: normalizedAddress,
    });
  };

  for (const item of normalizedValue.split(/[,\n;]+/)) {
    const raw = item.trim().replace(/^(to|cc|bcc)\s*:\s*/i, "");
    if (!raw) continue;

    const bracketMatch = raw.match(/^(.*)<([^>]+)>$/);
    if (bracketMatch) {
      const name = bracketMatch[1].trim().replace(/^"|"$/g, "") || null;
      const address = bracketMatch[2].trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.toLowerCase())) {
        addValid(name, address);
      } else {
        invalid.push(raw);
      }
      continue;
    }

    const emailMatches = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
    if (emailMatches.length === 0) {
      invalid.push(raw);
      continue;
    }

    if (emailMatches.length === 1) {
      const email = emailMatches[0];
      const nameCandidate = raw.replace(email, "").replace(/["()]/g, "").trim() || null;
      addValid(nameCandidate, email);
      continue;
    }

    for (const email of emailMatches) {
      addValid(null, email);
    }
  }

  return { valid, invalid };
}

function buildDraftSavePayload(composer: ComposerState): DraftSavePayload {
  const toAddresses = parseComposerAddressInput(composer.toInput).valid;
  const ccAddresses = parseComposerAddressInput(composer.ccInput).valid;
  const bccAddresses = parseComposerAddressInput(composer.bccInput).valid;
  const normalizedTextBody = composer.textBody.trim() ? composer.textBody : htmlToPlainText(composer.htmlBody);

  return {
    threadId: composer.threadId,
    to: toAddresses,
    cc: ccAddresses,
    bcc: bccAddresses,
    subject: composer.subject,
    htmlBody: composer.htmlBody,
    textBody: normalizedTextBody,
    attachments: composer.attachments.map((attachment) => ({
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      contentBase64: attachment.contentBase64,
    })),
  };
}

function serializeDraftSavePayload(payload: DraftSavePayload): string {
  return JSON.stringify(payload);
}

function hasDraftPayloadContent(payload: DraftSavePayload): boolean {
  return Boolean(
    payload.subject.trim()
      || payload.to.length > 0
      || payload.cc.length > 0
      || payload.bcc.length > 0
      || htmlToPlainText(payload.htmlBody).trim()
      || payload.textBody.trim()
      || payload.attachments.length > 0
  );
}

function htmlToPlainText(html: string): string {
  if (!html.trim()) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function buildReplyHtmlQuote(message: ThreadMessage): string {
  const author = formatAddressDisplay(message.from);
  const body = message.htmlBody || `<pre>${message.textBody || ""}</pre>`;
  return `<p><br/></p><hr/><p><strong>On ${formatDateTime(message.date)}, ${author} wrote:</strong></p>${body}`;
}

function normalizeReplySubject(subject: string): string {
  return /^re\s*:/i.test(subject) ? subject : `Re: ${subject || "(No subject)"}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const parts = result.split(",");
      if (parts.length < 2) {
        reject(new Error(`Failed to encode ${file.name}.`));
        return;
      }
      resolve(parts[1]);
    };
    reader.readAsDataURL(file);
  });
}

function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML === value) return;
    editorRef.current.innerHTML = value;
  }, [value]);

  const runCommand = (command: string, commandValue?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <Button type="button" size="sm" variant="outline" onClick={() => runCommand("bold")}>Bold</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => runCommand("italic")}>Italic</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => runCommand("underline")}>Underline</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => runCommand("insertUnorderedList")}>List</Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const link = window.prompt("Link URL");
            if (!link) return;
            runCommand("createLink", link);
          }}
        >
          Link
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="min-h-40 w-full rounded-md border border-[var(--ghost-border)] bg-midnight px-3 py-2 text-sm text-ice-white outline-none focus-visible:ring-2 focus-visible:ring-signal-orange/40"
      />
    </div>
  );
}

export function InboxClient() {
  const [folder, setFolder] = useState<FolderKey>("inbox");
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [status, setStatus] = useState<MailboxStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [threadsTotal, setThreadsTotal] = useState(0);
  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const [composerSaving, setComposerSaving] = useState(false);
  const [composerAutoSaving, setComposerAutoSaving] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [composerInfo, setComposerInfo] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerState>({
    open: false,
    mode: "new",
    sourceMessageId: null,
    draftId: null,
    draftVersion: null,
    threadId: null,
    toInput: "",
    ccInput: "",
    bccInput: "",
    subject: "",
    htmlBody: "",
    textBody: "",
    attachments: [],
  });
  const [showComposerCc, setShowComposerCc] = useState(false);
  const [showComposerBcc, setShowComposerBcc] = useState(false);
  const [showPlainTextFallback, setShowPlainTextFallback] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const autoMarkedReadMessageIdRef = useRef<string | null>(null);
  const syncInFlightRef = useRef(false);
  const initialDraftSnapshotRef = useRef<string | null>(null);
  const lastSavedDraftSnapshotRef = useRef<string | null>(null);

  const selectedMessage = useMemo(
    () => messages.find((item) => item.id === selectedMessageId) ?? null,
    [messages, selectedMessageId]
  );

  const composerAttachmentBytes = useMemo(
    () => composer.attachments.reduce((sum, item) => sum + item.size, 0),
    [composer.attachments]
  );

  const composerWordCount = useMemo(() => {
    const text = htmlToPlainText(composer.htmlBody);
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [composer.htmlBody]);

  const composerDraftPayload = useMemo(() => buildDraftSavePayload(composer), [composer]);

  const composerDraftSnapshot = useMemo(
    () => serializeDraftSavePayload(composerDraftPayload),
    [composerDraftPayload]
  );

  const composerHasDraftContent = useMemo(
    () => hasDraftPayloadContent(composerDraftPayload),
    [composerDraftPayload]
  );

  const composerTitle = useMemo(() => {
    if (composer.mode === "reply") return "Reply";
    if (composer.mode === "reply_all") return "Reply all";
    if (composer.mode === "draft") return "Edit draft";
    return "Compose";
  }, [composer.mode]);

  const composerDescription = useMemo(() => {
    if (composer.mode === "reply" || composer.mode === "reply_all") {
      return "Use Ctrl+Enter (or Cmd+Enter) to send quickly.";
    }
    return "Draft in a focused composer. Use Ctrl+Enter (or Cmd+Enter) to send.";
  }, [composer.mode]);

  const selectedThreadCursor = useMemo(() => {
    if (!status) return null;
    if (folder === "drafts") return status.cursors.find((cursor) => cursor.folderKey === "drafts") ?? null;
    return status.cursors.find((cursor) => cursor.folderKey === folder) ?? null;
  }, [folder, status]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(threadsTotal / pageSize)), [threadsTotal]);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/inbox/sync", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load inbox status.");
      }
      setStatus(payload as MailboxStatus);
      setStatusError(null);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Failed to load inbox status.");
    }
  }, []);

  const loadThreads = useCallback(async () => {
    if (folder === "drafts") return;
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams({
        folder,
        page: String(page),
        pageSize: String(pageSize),
      });
      if (query.trim()) params.set("q", query.trim());
      if (unreadOnly) params.set("unreadOnly", "true");

      const response = await fetch(`/api/admin/inbox/threads?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load inbox threads.");
      }
      const data = payload as { items: ThreadItem[]; total: number };
      setThreads(data.items);
      setThreadsTotal(data.total);
      if (data.items.length === 0) {
        setSelectedThreadId(null);
        setSelectedMessageId(null);
        setMessages([]);
      } else if (!selectedThreadId || !data.items.some((item) => item.threadId === selectedThreadId)) {
        setSelectedThreadId(data.items[0].threadId);
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Failed to load inbox threads.");
    } finally {
      setListLoading(false);
    }
  }, [folder, page, pageSize, query, selectedThreadId, unreadOnly]);

  const loadDrafts = useCallback(async () => {
    if (folder !== "drafts") return;
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/admin/inbox/drafts?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load drafts.");
      }
      const data = payload as { items: DraftListItem[]; total: number };
      setDrafts(data.items);
      setThreadsTotal(data.total);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Failed to load drafts.");
    } finally {
      setListLoading(false);
    }
  }, [folder, page, pageSize, query]);

  const loadThreadMessages = useCallback(async (threadId: string) => {
    setMessageLoading(true);
    setMessageError(null);
    try {
      const response = await fetch(`/api/admin/inbox/threads/${threadId}/messages`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load messages.");
      }
      const items = (payload as { items: ThreadMessage[] }).items;
      setMessages(items);
      if (items.length === 0) {
        setSelectedMessageId(null);
        return;
      }

      const currentFolderName = status?.folders[folder];
      const folderCandidates = currentFolderName
        ? items.filter((message) => message.folder === currentFolderName)
        : [];
      const sentCandidates = folder === "sent"
        ? items.filter((message) => message.direction === "outbound")
        : [];
      const preferredMessages = folderCandidates.length > 0
        ? folderCandidates
        : sentCandidates.length > 0
          ? sentCandidates
          : items;
      const preferredId = preferredMessages[preferredMessages.length - 1]?.id ?? items[items.length - 1].id;

      if (!selectedMessageId || !items.some((message) => message.id === selectedMessageId)) {
        setSelectedMessageId(preferredId);
        return;
      }

      const selectedMessage = items.find((message) => message.id === selectedMessageId);
      if (!selectedMessage) {
        setSelectedMessageId(preferredId);
        return;
      }

      if (folderCandidates.length > 0 && selectedMessage.folder !== currentFolderName) {
        setSelectedMessageId(preferredId);
        return;
      }

      if (
        folder === "sent"
        && sentCandidates.length > 0
        && selectedMessage.direction !== "outbound"
      ) {
        setSelectedMessageId(preferredId);
      }
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "Failed to load messages.");
    } finally {
      setMessageLoading(false);
    }
  }, [folder, selectedMessageId, status?.folders]);

  const refreshCurrentFolder = useCallback(async () => {
    if (folder === "drafts") {
      await loadDrafts();
      return;
    }
    await loadThreads();
    if (selectedThreadId) {
      await loadThreadMessages(selectedThreadId);
    }
  }, [folder, loadDrafts, loadThreadMessages, loadThreads, selectedThreadId]);

  const syncMailbox = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (syncInFlightRef.current) {
        if (!silent) {
          setSyncMessage("Another sync is already running.");
        }
        return;
      }

      syncInFlightRef.current = true;
      if (!silent) {
        setSyncing(true);
        setSyncMessage(null);
      }

      try {
        const response = await fetch("/api/admin/inbox/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderKey: folder }),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 409) {
          if (!silent) {
            setSyncMessage("Another sync is already running.");
          }
          return;
        }
        if (!response.ok) {
          throw new Error(payload.error || "Sync failed.");
        }

        if (!silent) {
          const imported = Number(payload.imported ?? 0);
          const updated = Number(payload.updated ?? 0);
          setSyncMessage(`Sync complete. Imported ${imported}, updated ${updated}.`);
        }

        await loadStatus();
        await refreshCurrentFolder();
      } catch (error) {
        if (!silent) {
          setSyncMessage(error instanceof Error ? error.message : "Sync failed.");
        }
      } finally {
        syncInFlightRef.current = false;
        if (!silent) {
          setSyncing(false);
        }
      }
    },
    [folder, loadStatus, refreshCurrentFolder]
  );

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    setPage(1);
    setSelectedThreadId(null);
    setSelectedMessageId(null);
    setMessages([]);
  }, [folder]);

  useEffect(() => {
    if (folder === "drafts") {
      void loadDrafts();
    } else {
      void loadThreads();
    }
  }, [folder, loadDrafts, loadThreads]);

  useEffect(() => {
    if (folder === "drafts") return;
    if (!selectedThreadId) return;
    void loadThreadMessages(selectedThreadId);
  }, [folder, loadThreadMessages, selectedThreadId]);

  useEffect(() => {
    if (page <= pageCount) return;
    setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    if (folder !== "inbox") return;
    if (!selectedMessage) return;
    if (selectedMessage.isRead) return;
    if (autoMarkedReadMessageIdRef.current === selectedMessage.id) return;

    const messageId = selectedMessage.id;
    const threadId = selectedMessage.threadId;
    autoMarkedReadMessageIdRef.current = messageId;

    let cancelled = false;
    const markOpenedMessageAsRead = async () => {
      try {
        const response = await fetch(`/api/admin/inbox/messages/${messageId}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seen: true }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Failed to update read state.");
        }
        if (cancelled) return;

        setMessages((prev) =>
          prev.map((message) => (
            message.id === messageId ? { ...message, isRead: true } : message
          ))
        );
        setThreads((prev) =>
          prev.map((thread) => (
            thread.threadId === threadId
              ? { ...thread, unreadCount: Math.max(0, thread.unreadCount - 1) }
              : thread
          ))
        );
      } catch (error) {
        if (cancelled) return;
        setMessageError(error instanceof Error ? error.message : "Failed to update read state.");
      }
    };

    void markOpenedMessageAsRead();
    return () => {
      cancelled = true;
    };
  }, [folder, selectedMessage]);

  useEffect(() => {
    const intervalSeconds = Math.max(
      10,
      status?.syncIntervalSeconds && status.syncIntervalSeconds > 0
        ? status.syncIntervalSeconds
        : DEFAULT_POLL_SECONDS
    );

    const poll = () => {
      if (status?.hasImapSecrets) {
        void syncMailbox({ silent: true });
        return;
      }
      void loadStatus();
      void refreshCurrentFolder();
    };

    const timer = window.setInterval(poll, intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [loadStatus, refreshCurrentFolder, status?.hasImapSecrets, status?.syncIntervalSeconds, syncMailbox]);

  const runSync = useCallback(async () => {
    await syncMailbox({ silent: false });
  }, [syncMailbox]);

  const setComposerField = <K extends keyof ComposerState>(key: K, value: ComposerState[K]) => {
    setComposer((prev) => ({ ...prev, [key]: value }));
  };

  const handleComposerRecipientPaste = (
    field: ComposerRecipientField,
    event: ReactClipboardEvent<HTMLInputElement>
  ) => {
    if (composer.mode === "reply" || composer.mode === "reply_all") return;
    const pastedText = event.clipboardData.getData("text");
    if (!pastedText.trim()) return;

    const looksLikeBulkList = /[,\n;\t]/.test(pastedText) || /(?:^|\s)(to|cc|bcc)\s*:/i.test(pastedText);
    if (!looksLikeBulkList) return;

    event.preventDefault();
    setComposerError(null);
    setComposerInfo(null);

    const parsedPasted = parseComposerAddressInput(pastedText);
    if (parsedPasted.valid.length === 0) {
      setComposerError("No valid email addresses found in pasted text.");
      return;
    }

    const existing = parseComposerAddressInput(composer[field]).valid;
    const seen = new Set(existing.map((entry) => entry.address.toLowerCase()));
    const merged = [...existing];
    let addedCount = 0;

    for (const entry of parsedPasted.valid) {
      const normalizedAddress = entry.address.toLowerCase();
      if (seen.has(normalizedAddress)) continue;
      seen.add(normalizedAddress);
      merged.push(entry);
      addedCount += 1;
    }

    setComposer((prev) => ({
      ...prev,
      [field]: stringifyAddressList(merged),
    }));

    if (parsedPasted.invalid.length > 0) {
      setComposerInfo(`Added ${addedCount} recipient(s); skipped ${parsedPasted.invalid.length} invalid entr${parsedPasted.invalid.length === 1 ? "y" : "ies"}.`);
    }
  };

  const persistDraftSnapshot = useCallback(
    async (
      snapshot: ComposerState,
      {
        auto = false,
        navigateToDrafts = !auto,
        showSavedMessage = !auto,
        manageSavingState = !auto,
      }: {
        auto?: boolean;
        navigateToDrafts?: boolean;
        showSavedMessage?: boolean;
        manageSavingState?: boolean;
      } = {}
    ): Promise<boolean> => {
      const payload = buildDraftSavePayload(snapshot);
      const payloadSnapshot = serializeDraftSavePayload(payload);
      if (auto) {
        const unchanged = payloadSnapshot === lastSavedDraftSnapshotRef.current;
        const untouchedSession = !snapshot.draftId && payloadSnapshot === initialDraftSnapshotRef.current;
        if (unchanged || untouchedSession || !hasDraftPayloadContent(payload)) {
          return false;
        }
      }

      if (manageSavingState) {
        setComposerSaving(true);
      } else if (auto) {
        setComposerAutoSaving(true);
      }

      if (!auto) {
        setComposerError(null);
      }
      if (showSavedMessage) {
        setComposerInfo(null);
      }

      try {
        const isUpdate = Boolean(snapshot.draftId);
        const response = await fetch(
          isUpdate ? `/api/admin/inbox/drafts/${snapshot.draftId}` : "/api/admin/inbox/drafts",
          {
            method: isUpdate ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              isUpdate
                ? {
                    ...payload,
                    version: snapshot.draftVersion,
                  }
                : payload
            ),
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to save draft.");
        }
        const saved = data as DraftDetail;
        lastSavedDraftSnapshotRef.current = payloadSnapshot;
        setComposer((prev) => ({
          ...prev,
          draftId: saved.id,
          draftVersion: saved.version,
          threadId: saved.threadId ?? prev.threadId,
        }));
        if (showSavedMessage) {
          setComposerInfo("Draft saved.");
        }
        if (navigateToDrafts) {
          setFolder("drafts");
          await loadDrafts();
        }
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save draft.";
        setComposerError(auto ? `Auto-save failed: ${message}` : message);
        return false;
      } finally {
        if (manageSavingState) {
          setComposerSaving(false);
        } else if (auto) {
          setComposerAutoSaving(false);
        }
      }
    },
    [loadDrafts]
  );

  const openComposer = useCallback((nextComposer: ComposerState) => {
    setShowComposerCc(Boolean(nextComposer.ccInput.trim()));
    setShowComposerBcc(Boolean(nextComposer.bccInput.trim()));
    setShowPlainTextFallback(Boolean(nextComposer.textBody.trim()));
    const nextSnapshot = serializeDraftSavePayload(buildDraftSavePayload(nextComposer));
    initialDraftSnapshotRef.current = nextSnapshot;
    lastSavedDraftSnapshotRef.current = nextComposer.draftId ? nextSnapshot : null;
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setComposerAutoSaving(false);
    setComposer(nextComposer);
  }, []);

  const closeComposer = useCallback((options?: { skipAutoSave?: boolean }) => {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (
      !options?.skipAutoSave
      && composer.open
      && composerHasDraftContent
      && composerDraftSnapshot !== lastSavedDraftSnapshotRef.current
    ) {
      void persistDraftSnapshot(composer, {
        auto: true,
        navigateToDrafts: false,
        showSavedMessage: false,
        manageSavingState: false,
      });
    }
    setComposer((prev) => ({ ...prev, open: false }));
  }, [composer, composerDraftSnapshot, composerHasDraftContent, persistDraftSnapshot]);

  const openNewComposer = () => {
    setComposerError(null);
    setComposerInfo(null);
    openComposer({
      open: true,
      mode: "new",
      sourceMessageId: null,
      draftId: null,
      draftVersion: null,
      threadId: null,
      toInput: "",
      ccInput: "",
      bccInput: "",
      subject: "",
      htmlBody: "",
      textBody: "",
      attachments: [],
    });
  };

  const openReplyComposer = (mode: "reply" | "reply_all") => {
    if (!selectedMessage) return;
    const toAddresses = [{ name: selectedMessage.from.name, address: selectedMessage.from.email }];
    const ccAddresses = mode === "reply_all"
      ? parseAddressList(selectedMessage.to).concat(parseAddressList(selectedMessage.cc))
      : [];
    const senderEmail = (selectedMessage.from.email || "").toLowerCase();
    const filteredCc = ccAddresses.filter((entry) => {
      const email = (entry.address || entry.email || "").toLowerCase();
      if (!email) return false;
      if (email === senderEmail) return false;
      if (email === "contact@crrt.tech") return false;
      return true;
    });

    setComposerError(null);
    setComposerInfo(null);
    openComposer({
      open: true,
      mode,
      sourceMessageId: selectedMessage.id,
      draftId: null,
      draftVersion: null,
      threadId: selectedMessage.threadId,
      toInput: stringifyAddressList(parseAddressList(toAddresses)),
      ccInput: stringifyAddressList(filteredCc),
      bccInput: "",
      subject: normalizeReplySubject(selectedMessage.subject),
      htmlBody: buildReplyHtmlQuote(selectedMessage),
      textBody: "",
      attachments: [],
    });
  };

  const openDraftComposer = async (draftId: string) => {
    setComposerSaving(true);
    setComposerError(null);
    setComposerInfo(null);
    try {
      const response = await fetch(`/api/admin/inbox/drafts/${draftId}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load draft.");
      }
      const draft = payload as DraftDetail;
      const nextComposer: ComposerState = {
        open: true,
        mode: "draft",
        sourceMessageId: null,
        draftId: draft.id,
        draftVersion: draft.version,
        threadId: draft.threadId,
        toInput: stringifyAddressList(parseAddressList(draft.to)),
        ccInput: stringifyAddressList(parseAddressList(draft.cc)),
        bccInput: stringifyAddressList(parseAddressList(draft.bcc)),
        subject: draft.subject,
        htmlBody: draft.htmlBody || "",
        textBody: draft.textBody || "",
        attachments: draft.attachments
          .filter((attachment) => typeof attachment.contentBase64 === "string")
          .map((attachment) => ({
            id: attachment.id,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            size: attachment.size,
            contentBase64: attachment.contentBase64 || "",
          })),
      };
      openComposer(nextComposer);
      if (draft.attachments.some((attachment) => !attachment.contentBase64)) {
        setComposerInfo("Some existing draft attachments were not loaded and may need re-upload.");
      }
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : "Failed to load draft.");
    } finally {
      setComposerSaving(false);
    }
  };

  const onAddComposerAttachments = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setComposerError(null);
    const incomingBytes = Array.from(files).reduce((sum, file) => sum + file.size, 0);
    if (composerAttachmentBytes + incomingBytes > OUTGOING_ATTACHMENT_MAX_TOTAL_BYTES) {
      setComposerError("Attachments exceed 25 MB total.");
      return;
    }
    try {
      const created = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          contentBase64: await fileToBase64(file),
        }))
      );
      setComposer((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...created],
      }));
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : "Failed to read attachment.");
    }
  };

  const deleteDraft = async (draftId: string) => {
    setComposerSaving(true);
    setComposerError(null);
    try {
      const response = await fetch(`/api/admin/inbox/drafts/${draftId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete draft.");
      }
      if (composer.draftId === draftId) {
        setComposer((prev) => ({ ...prev, open: false, draftId: null }));
      }
      await loadDrafts();
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : "Failed to delete draft.");
    } finally {
      setComposerSaving(false);
    }
  };

  const saveDraft = async () => {
    await persistDraftSnapshot(composer, {
      auto: false,
      navigateToDrafts: true,
      showSavedMessage: true,
      manageSavingState: true,
    });
  };

  useEffect(() => {
    if (!composer.open) return;
    if (composerSaving) return;
    if (!composerHasDraftContent) return;
    if (!composer.draftId && composerDraftSnapshot === initialDraftSnapshotRef.current) return;
    if (composerDraftSnapshot === lastSavedDraftSnapshotRef.current) return;

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    const snapshot = composer;
    autoSaveTimerRef.current = window.setTimeout(() => {
      void persistDraftSnapshot(snapshot, {
        auto: true,
        navigateToDrafts: false,
        showSavedMessage: false,
        manageSavingState: false,
      });
    }, AUTO_SAVE_DRAFT_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [
    composer,
    composer.draftId,
    composer.open,
    composerDraftSnapshot,
    composerHasDraftContent,
    composerSaving,
    persistDraftSnapshot,
  ]);

  const sendFromComposer = async () => {
    const normalizedTextBody = composer.textBody.trim() ? composer.textBody : htmlToPlainText(composer.htmlBody);
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setComposerSaving(true);
    setComposerError(null);
    setComposerInfo(null);
    try {
      const hasUnsavedDraftChanges = Boolean(
        composer.draftId
        && composerDraftSnapshot !== lastSavedDraftSnapshotRef.current
      );
      if (hasUnsavedDraftChanges) {
        const persisted = await persistDraftSnapshot(composer, {
          auto: false,
          navigateToDrafts: false,
          showSavedMessage: false,
          manageSavingState: false,
        });
        if (!persisted) {
          return;
        }
      }

      let response: Response;
      if (composer.draftId) {
        response = await fetch(`/api/admin/inbox/drafts/${composer.draftId}/send`, {
          method: "POST",
        });
      } else if (
        (composer.mode === "reply" || composer.mode === "reply_all")
        && composer.sourceMessageId
      ) {
        response = await fetch("/api/admin/inbox/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId: composer.sourceMessageId,
            mode: composer.mode,
            htmlBody: composer.htmlBody,
            textBody: normalizedTextBody,
            attachments: composer.attachments.map((attachment) => ({
              filename: attachment.filename,
              mimeType: attachment.mimeType,
              contentBase64: attachment.contentBase64,
            })),
          }),
        });
      } else {
        const toAddresses = parseComposerAddressInput(composer.toInput);
        const ccAddresses = parseComposerAddressInput(composer.ccInput);
        const bccAddresses = parseComposerAddressInput(composer.bccInput);
        const invalid = [...toAddresses.invalid, ...ccAddresses.invalid, ...bccAddresses.invalid];
        if (invalid.length > 0) {
          throw new Error(`Fix invalid recipient(s): ${invalid.slice(0, 3).join(", ")}`);
        }
        const recipientCount = toAddresses.valid.length + ccAddresses.valid.length + bccAddresses.valid.length;
        if (recipientCount === 0) {
          throw new Error("Add at least one recipient.");
        }
        response = await fetch("/api/admin/inbox/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: toAddresses.valid,
            cc: ccAddresses.valid,
            bcc: bccAddresses.valid,
            subject: composer.subject,
            htmlBody: composer.htmlBody,
            textBody: normalizedTextBody,
            attachments: composer.attachments.map((attachment) => ({
              filename: attachment.filename,
              mimeType: attachment.mimeType,
              contentBase64: attachment.contentBase64,
            })),
          }),
        });
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to send message.");
      }

      setComposerInfo("Message sent.");
      closeComposer({ skipAutoSave: true });
      setFolder("sent");
      setPage(1);
      await loadThreads();
      await loadStatus();
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : "Failed to send message.");
    } finally {
      setComposerSaving(false);
    }
  };

  const markReadState = async (seen: boolean) => {
    if (!selectedMessage) return;
    try {
      const response = await fetch(`/api/admin/inbox/messages/${selectedMessage.id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update read state.");
      }
      await refreshCurrentFolder();
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "Failed to update read state.");
    }
  };

  const moveSelectedMessage = async (targetFolder: "inbox" | "archive" | "trash") => {
    if (!selectedMessage) return;
    try {
      const response = await fetch(`/api/admin/inbox/messages/${selectedMessage.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetFolder }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to move message.");
      }
      await refreshCurrentFolder();
      if (targetFolder !== folder) {
        setSelectedMessageId(null);
      }
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "Failed to move message.");
    }
  };

  const hardDeleteSelectedMessage = async () => {
    if (!selectedMessage) return;
    const messageId = selectedMessage.id;
    const confirmed = window.confirm("Permanently delete this message? This action cannot be undone.");
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/admin/inbox/messages/${messageId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete message.");
      }
      await refreshCurrentFolder();
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "Failed to delete message.");
    }
  };

  const handleComposerDialogOpenChange = (open: boolean) => {
    if (composerSaving) return;
    if (!open) {
      closeComposer();
    }
  };

  const handleComposerKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (composerSaving) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "enter") {
      event.preventDefault();
      void sendFromComposer();
    }
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-8">
      <PageHeader
        title="Inbox"
        description="Shared mailbox for contact@crrt.tech"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="border-[var(--ghost-border)] bg-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white"
              onClick={runSync}
              disabled={syncing || !status?.hasImapSecrets}
            >
              <RefreshCcw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync now"}
            </Button>
            <Button size="sm" onClick={openNewComposer}>
              <MailPlus size={14} />
              Compose
            </Button>
          </>
        }
      />

      {!status?.hasImapSecrets ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
          IMAP secrets are missing. Set `IMAP_USER` and `IMAP_PASS` in environment, then test from Admin Settings.
        </div>
      ) : null}
      {!status?.hasSmtpSecrets ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
          SMTP secrets are missing. Set `SMTP_USER` and `SMTP_PASS` in environment to send outbound mail.
        </div>
      ) : null}
      {statusError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {statusError}
        </div>
      ) : null}
      {syncMessage ? (
        <div className="rounded-xl border border-[var(--ghost-border)] bg-midnight-light px-4 py-3 text-xs text-steel-gray">
          {syncMessage}
        </div>
      ) : null}

      <div className="rounded-xl border border-[var(--ghost-border)] bg-midnight-light p-3">
        <div className="flex flex-wrap items-center gap-2">
          {FOLDERS.map((item) => (
            <Button
              key={item.key}
              type="button"
              size="sm"
              variant={folder === item.key ? "default" : "outline"}
              className={folder === item.key
                ? ""
                : "border-[var(--ghost-border)] bg-transparent text-steel-gray hover:bg-white/5 hover:text-ice-white"}
              onClick={() => setFolder(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="space-y-3 rounded-xl border border-[var(--ghost-border)] bg-midnight-light p-3">
          <div className="space-y-2">
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={folder === "drafts" ? "Search drafts..." : "Search subject, sender, content..."}
              className="border-[var(--ghost-border)] bg-midnight text-ice-white"
            />
            {folder !== "drafts" ? (
              <label className="inline-flex items-center gap-2 text-xs text-steel-gray">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(event) => {
                    setUnreadOnly(event.target.checked);
                    setPage(1);
                  }}
                />
                Unread only
              </label>
            ) : null}
          </div>

          {selectedThreadCursor ? (
            <p className="text-[11px] text-steel-gray">
              Last sync: {selectedThreadCursor.lastSyncedAt ? formatDateTime(selectedThreadCursor.lastSyncedAt) : "Never"}
            </p>
          ) : null}

          {listError ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {listError}
            </div>
          ) : null}

          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {folder === "drafts" ? (
              drafts.length === 0 && !listLoading ? (
                <div className="rounded-md border border-[var(--ghost-border)] px-3 py-4 text-center text-xs text-steel-gray">
                  No drafts.
                </div>
              ) : (
                drafts.map((draft) => (
                  <button
                    type="button"
                    key={draft.id}
                    onClick={() => void openDraftComposer(draft.id)}
                    className="w-full rounded-lg border border-[var(--ghost-border)] bg-midnight px-3 py-2 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <p className="truncate text-sm text-ice-white">{draft.subject || "(Draft)"}</p>
                    <p className="truncate text-xs text-steel-gray">{stringifyAddressList(parseAddressList(draft.to)) || "No recipients"}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-steel-gray">
                      <span>{formatDateTime(draft.updatedAt)}</span>
                      <span>{draft.attachmentCount} attachment(s)</span>
                    </div>
                  </button>
                ))
              )
            ) : threads.length === 0 && !listLoading ? (
              <div className="rounded-md border border-[var(--ghost-border)] px-3 py-4 text-center text-xs text-steel-gray">
                No conversations.
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  type="button"
                  key={thread.threadId}
                  onClick={() => setSelectedThreadId(thread.threadId)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    selectedThreadId === thread.threadId
                      ? "border-signal-orange/40 bg-signal-orange/10"
                      : "border-[var(--ghost-border)] bg-midnight hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-sm text-ice-white">{thread.subject || "(No subject)"}</p>
                    {thread.unreadCount > 0 ? (
                      <Badge className="bg-signal-orange text-white">{thread.unreadCount}</Badge>
                    ) : null}
                  </div>
                  <p className="line-clamp-1 text-xs text-steel-gray">
                    {formatAddressDisplay(thread.from)}
                  </p>
                  <p className="line-clamp-2 text-xs text-steel-gray">
                    {thread.snippet || "No preview"}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-steel-gray">
                    <span>{formatDateTime(thread.date)}</span>
                    {thread.hasAttachments ? <span>Attachment(s)</span> : null}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--ghost-border)] pt-2 text-xs text-steel-gray">
            <span>Total: {threadsTotal}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <span>Page {page} / {pageCount}</span>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={page >= pageCount}
              >
                Next
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--ghost-border)] bg-midnight-light p-4">
          {folder === "drafts" ? (
            <div className="flex h-full min-h-[520px] items-center justify-center">
              <div className="space-y-3 text-center">
                <p className="text-sm text-steel-gray">Select a draft from the left or compose a new message.</p>
                <Button size="sm" onClick={openNewComposer}>
                  <MailPlus size={14} />
                  New message
                </Button>
              </div>
            </div>
          ) : !selectedMessage ? (
            <div className="flex h-full min-h-[520px] items-center justify-center text-sm text-steel-gray">
              Select a conversation to read.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ghost-border)] pb-3">
                <div>
                  <h2 className="text-lg font-heading font-semibold text-ice-white">
                    {selectedMessage.subject || "(No subject)"}
                  </h2>
                  <p className="text-xs text-steel-gray">{formatDateTime(selectedMessage.date)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => void markReadState(!selectedMessage.isRead)}
                  >
                    {selectedMessage.isRead ? "Mark unread" : "Mark read"}
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => openReplyComposer("reply")}>
                    <Reply size={12} /> Reply
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => openReplyComposer("reply_all")}>
                    <ReplyAll size={12} /> Reply all
                  </Button>
                  {folder !== "archive" ? (
                    <Button size="xs" variant="outline" onClick={() => void moveSelectedMessage("archive")}>
                      <Archive size={12} /> Archive
                    </Button>
                  ) : (
                    <Button size="xs" variant="outline" onClick={() => void moveSelectedMessage("inbox")}>
                      <ArrowLeft size={12} /> To inbox
                    </Button>
                  )}
                  {folder !== "trash" ? (
                    <Button size="xs" variant="outline" onClick={() => void moveSelectedMessage("trash")}>
                      <Trash2 size={12} /> Trash
                    </Button>
                  ) : (
                    <>
                      <Button size="xs" variant="outline" onClick={() => void moveSelectedMessage("inbox")}>
                        <ArrowLeft size={12} /> Restore
                      </Button>
                      <Button size="xs" variant="destructive" onClick={() => void hardDeleteSelectedMessage()}>
                        <Trash2 size={12} /> Delete forever
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {messageError ? (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {messageError}
                </div>
              ) : null}

              <div className="space-y-1 text-xs text-steel-gray">
                <p>
                  <span className="text-ice-white">From:</span>{" "}
                  {formatAddressDisplay(selectedMessage.from)}
                </p>
                <p>
                  <span className="text-ice-white">To:</span>{" "}
                  {stringifyAddressList(parseAddressList(selectedMessage.to)) || "-"}
                </p>
                {parseAddressList(selectedMessage.cc).length > 0 ? (
                  <p>
                    <span className="text-ice-white">Cc:</span>{" "}
                    {stringifyAddressList(parseAddressList(selectedMessage.cc))}
                  </p>
                ) : null}
              </div>

              {selectedMessage.attachments.length > 0 ? (
                <div className="rounded-lg border border-[var(--ghost-border)] bg-midnight p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-steel-gray">Attachments</p>
                  <div className="space-y-1">
                    {selectedMessage.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={`/api/admin/inbox/attachments/${attachment.id}`}
                        className="flex items-center justify-between rounded-md border border-[var(--ghost-border)] px-2 py-1 text-xs text-steel-gray transition-colors hover:bg-white/[0.03] hover:text-ice-white"
                      >
                        <span className="truncate">{attachment.filename}</span>
                        <span className="inline-flex items-center gap-1">
                          {formatFileSize(attachment.size)} <Download size={12} />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="min-h-64 rounded-lg border border-[var(--ghost-border)] bg-midnight p-4 text-sm text-ice-white">
                {selectedMessage.htmlBody ? (
                  <div
                    className="prose prose-sm max-w-none prose-a:text-signal-orange prose-strong:text-ice-white"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.htmlBody }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm">
                    {selectedMessage.textBody || ""}
                  </pre>
                )}
              </div>
            </div>
          )}

          {messageLoading ? (
            <p className="mt-4 text-xs text-steel-gray">Loading messages...</p>
          ) : null}
        </section>
      </div>

      <Dialog open={composer.open} onOpenChange={handleComposerDialogOpenChange}>
        <DialogContent
          className="top-4 max-h-[calc(100dvh-2rem)] w-[min(1000px,calc(100%-1rem))] translate-y-0 overflow-y-auto overscroll-contain border-[var(--ghost-border)] bg-midnight-light p-0 text-ice-white sm:top-8 sm:max-h-[calc(100dvh-4rem)] sm:w-[min(1000px,calc(100%-2rem))] sm:max-w-[1000px]"
          showCloseButton={false}
          onEscapeKeyDown={(event) => {
            if (composerSaving) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (composerSaving) event.preventDefault();
          }}
        >
          <div onKeyDown={handleComposerKeyDown}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--ghost-border)] px-4 py-3">
              <div className="space-y-1">
                <DialogTitle className="font-heading text-base text-ice-white">{composerTitle}</DialogTitle>
                <DialogDescription className="text-xs text-steel-gray">{composerDescription}</DialogDescription>
                {composerAutoSaving ? (
                  <p className="text-[11px] text-steel-gray">Autosaving draft...</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {composer.draftId ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void deleteDraft(composer.draftId!)}
                    disabled={composerSaving}
                  >
                    <Trash2 size={12} /> Delete draft
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => closeComposer()}
                  disabled={composerSaving}
                >
                  <CornerDownLeft size={12} /> Close
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={saveDraft} disabled={composerSaving}>
                  <Save size={12} /> {composerSaving ? "Saving..." : "Save draft"}
                </Button>
                <Button type="button" size="sm" onClick={sendFromComposer} disabled={composerSaving}>
                  <Send size={12} /> {composerSaving ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>

            <div className="space-y-4 px-4 py-3">
              <div className="space-y-2 rounded-lg border border-[var(--ghost-border)] bg-midnight p-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-steel-gray">To</label>
                    {composer.mode !== "reply" && composer.mode !== "reply_all" ? (
                      <div className="flex items-center gap-1 text-[11px]">
                        {!showComposerCc ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-steel-gray hover:text-ice-white"
                            onClick={() => setShowComposerCc(true)}
                          >
                            Add Cc
                          </Button>
                        ) : null}
                        {!showComposerBcc ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-steel-gray hover:text-ice-white"
                            onClick={() => setShowComposerBcc(true)}
                          >
                            Add Bcc
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <Input
                    value={composer.toInput}
                    onChange={(event) => setComposerField("toInput", event.target.value)}
                    onPaste={(event) => handleComposerRecipientPaste("toInput", event)}
                    placeholder="name@example.com (paste comma, semicolon, or newline list)"
                    readOnly={composer.mode === "reply" || composer.mode === "reply_all"}
                    className="border-[var(--ghost-border)] bg-midnight text-ice-white read-only:cursor-not-allowed read-only:opacity-80"
                  />
                </div>

                {showComposerCc || composer.ccInput.trim() ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs text-steel-gray">Cc</label>
                      {composer.mode !== "reply" && composer.mode !== "reply_all" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-steel-gray hover:text-ice-white"
                          onClick={() => {
                            setShowComposerCc(false);
                            setComposerField("ccInput", "");
                          }}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <Input
                      value={composer.ccInput}
                      onChange={(event) => setComposerField("ccInput", event.target.value)}
                      onPaste={(event) => handleComposerRecipientPaste("ccInput", event)}
                      placeholder="Optional (paste recipient list)"
                      readOnly={composer.mode === "reply" || composer.mode === "reply_all"}
                      className="border-[var(--ghost-border)] bg-midnight text-ice-white read-only:cursor-not-allowed read-only:opacity-80"
                    />
                  </div>
                ) : null}

                {showComposerBcc || composer.bccInput.trim() ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs text-steel-gray">Bcc</label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-steel-gray hover:text-ice-white"
                        onClick={() => {
                          setShowComposerBcc(false);
                          setComposerField("bccInput", "");
                        }}
                        disabled={composer.mode === "reply" || composer.mode === "reply_all"}
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      value={composer.bccInput}
                      onChange={(event) => setComposerField("bccInput", event.target.value)}
                      onPaste={(event) => handleComposerRecipientPaste("bccInput", event)}
                      placeholder="Optional (paste recipient list)"
                      readOnly={composer.mode === "reply" || composer.mode === "reply_all"}
                      className="border-[var(--ghost-border)] bg-midnight text-ice-white read-only:cursor-not-allowed read-only:opacity-80"
                    />
                  </div>
                ) : null}

                {(composer.mode === "reply" || composer.mode === "reply_all") ? (
                  <p className="text-[11px] text-steel-gray">Recipients are fixed by reply mode for this thread.</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-steel-gray">Subject</label>
                <Input
                  value={composer.subject}
                  onChange={(event) => setComposerField("subject", event.target.value)}
                  placeholder="Subject"
                  className="border-[var(--ghost-border)] bg-midnight text-ice-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-steel-gray">Message</label>
                  <span className="text-[11px] text-steel-gray">
                    {composerWordCount} word{composerWordCount === 1 ? "" : "s"}
                  </span>
                </div>
                <RichTextEditor
                  value={composer.htmlBody}
                  onChange={(html) => setComposerField("htmlBody", html)}
                />
              </div>

              <div className="space-y-2 rounded-lg border border-[var(--ghost-border)] bg-midnight p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-steel-gray">Attachments (max 25 MB total)</p>
                  <span className="text-[11px] text-steel-gray">{formatFileSize(composerAttachmentBytes)} used</span>
                </div>
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-[var(--ghost-border)] px-3 py-2 text-sm text-steel-gray hover:bg-white/[0.03] hover:text-ice-white">
                  <FilePlus2 size={12} />
                  Add file(s)
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(event) => {
                      void onAddComposerAttachments(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {composer.attachments.length > 0 ? (
                  <div className="space-y-1">
                    {composer.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between rounded-md border border-[var(--ghost-border)] bg-midnight-light px-2 py-1 text-xs text-steel-gray"
                      >
                        <span className="truncate">
                          {attachment.filename} ({formatFileSize(attachment.size)})
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setComposer((prev) => ({
                              ...prev,
                              attachments: prev.attachments.filter((item) => item.id !== attachment.id),
                            }));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-steel-gray">No attachments.</p>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-fit px-0 text-xs text-steel-gray hover:bg-transparent hover:text-ice-white"
                  onClick={() => setShowPlainTextFallback((prev) => !prev)}
                >
                  {showPlainTextFallback ? "Hide plain text fallback" : "Edit plain text fallback"}
                </Button>
                {showPlainTextFallback ? (
                  <textarea
                    value={composer.textBody}
                    onChange={(event) => setComposerField("textBody", event.target.value)}
                    className="min-h-24 w-full rounded-md border border-[var(--ghost-border)] bg-midnight px-3 py-2 text-sm text-ice-white"
                    placeholder="Optional plain text version"
                  />
                ) : (
                  <p className="text-[11px] text-steel-gray">
                    Plain text is generated from your message body when left empty.
                  </p>
                )}
              </div>
            </div>

            {(composerError || composerInfo) ? (
              <div className="space-y-2 border-t border-[var(--ghost-border)] px-4 py-3">
                {composerError ? (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {composerError}
                  </div>
                ) : null}
                {composerInfo ? (
                  <div className="rounded-md border border-[var(--ghost-border)] bg-midnight px-3 py-2 text-xs text-steel-gray">
                    {composerInfo}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
