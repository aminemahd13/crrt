interface LogPayload {
  level: "info" | "error";
  message: string;
  requestId?: string | null;
  pathname?: string;
  method?: string;
  status?: number;
  details?: Record<string, unknown>;
}

function write(payload: LogPayload) {
  const body = {
    timestamp: new Date().toISOString(),
    ...payload,
  };
  console.log(JSON.stringify(body));
}

export function logInfo(message: string, input: Omit<LogPayload, "level" | "message"> = {}) {
  write({ level: "info", message, ...input });
}

export function logError(message: string, input: Omit<LogPayload, "level" | "message"> = {}) {
  write({ level: "error", message, ...input });
}
