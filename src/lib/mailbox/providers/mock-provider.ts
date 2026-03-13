import type {
  FolderSyncResult,
  MailboxProvider,
  ProviderMessage,
} from "@/lib/mailbox/types";

interface MockMailboxState {
  folders: Record<string, ProviderMessage[]>;
}

const defaultState: MockMailboxState = {
  folders: {
    INBOX: [],
    Sent: [],
    Drafts: [],
    Archive: [],
    Trash: [],
  },
};

let state: MockMailboxState = structuredClone(defaultState);

export function __resetMockMailboxState() {
  state = structuredClone(defaultState);
}

export function __setMockMailboxState(next: MockMailboxState) {
  state = next;
}

export class MockMailboxProvider implements MailboxProvider {
  async verify() {
    return { ok: true, details: { provider: "mock", folders: Object.keys(state.folders).length } };
  }

  async syncFolder(input: {
    folderName: string;
    cursorUidValidity: bigint | null;
    cursorHighestUid: number | null;
    sinceDate: Date;
    mailboxAddress: string;
  }): Promise<FolderSyncResult> {
    const messages = (state.folders[input.folderName] ?? [])
      .filter((message) => message.date >= input.sinceDate)
      .filter((message) =>
        input.cursorHighestUid && input.cursorUidValidity
          ? message.uid > input.cursorHighestUid
          : true
      );

    return {
      folderName: input.folderName,
      uidValidity: input.cursorUidValidity ?? BigInt(1),
      highestUid:
        messages.length > 0
          ? Math.max(...messages.map((message) => message.uid))
          : input.cursorHighestUid ?? null,
      reset: false,
      messages,
      flagUpdates: messages.map((message) => ({
        uid: message.uid,
        isRead: message.isRead,
        isFlagged: message.isFlagged,
        internalDate: message.internalDate,
      })),
    };
  }

  async setSeen(input: { folderName: string; uid: number; seen: boolean }): Promise<void> {
    const messages = state.folders[input.folderName] ?? [];
    const target = messages.find((message) => message.uid === input.uid);
    if (target) target.isRead = input.seen;
  }

  async moveMessage(input: {
    sourceFolder: string;
    uid: number;
    destinationFolder: string;
  }): Promise<void> {
    const sourceMessages = state.folders[input.sourceFolder] ?? [];
    const targetIndex = sourceMessages.findIndex((message) => message.uid === input.uid);
    if (targetIndex === -1) return;
    const [moved] = sourceMessages.splice(targetIndex, 1);
    moved.folderName = input.destinationFolder;
    state.folders[input.destinationFolder] = state.folders[input.destinationFolder] ?? [];
    state.folders[input.destinationFolder].push(moved);
  }

  async appendMessage(input: {
    folderName: string;
    content: Buffer;
    flags?: string[];
    date?: Date;
  }): Promise<{ uidValidity: bigint | null; uid: number | null }> {
    void input;
    return { uidValidity: BigInt(1), uid: null };
  }

  async close(): Promise<void> {
    return;
  }
}
