type CounterMap = Map<string, number>;

const counters: CounterMap = new Map<string, number>();
const startedAt = Date.now();

function inc(key: string, value = 1) {
  counters.set(key, (counters.get(key) ?? 0) + value);
}

export function recordApiRequest(pathname: string, method: string) {
  inc("api_requests_total");
  inc(`api_requests_path_total{path="${pathname}",method="${method}"}`);
}

export function recordApiError(pathname: string, method: string) {
  inc("api_errors_total");
  inc(`api_errors_path_total{path="${pathname}",method="${method}"}`);
}

export function recordRegistrationCreated(status: string) {
  inc("event_registrations_total");
  inc(`event_registrations_status_total{status="${status}"}`);
}

export function recordApplicationAction(action: string) {
  inc("admin_application_actions_total");
  inc(`admin_application_actions_total{action="${action}"}`);
}

export function recordApplicationFailure(action: string) {
  inc("admin_application_failures_total");
  inc(`admin_application_failures_total{action="${action}"}`);
}

export function recordInboxSync(result: "success" | "failure") {
  inc("admin_inbox_sync_total");
  inc(`admin_inbox_sync_total{result="${result}"}`);
}

export function recordInboxSend(result: "success" | "failure") {
  inc("admin_inbox_send_total");
  inc(`admin_inbox_send_total{result="${result}"}`);
}

export function recordInboxDraft(action: "create" | "update" | "delete" | "send", result: "success" | "failure") {
  inc("admin_inbox_draft_total");
  inc(`admin_inbox_draft_total{action="${action}",result="${result}"}`);
}

export function recordInboxMessageAction(action: "mark_read" | "move" | "delete", result: "success" | "failure") {
  inc("admin_inbox_message_action_total");
  inc(`admin_inbox_message_action_total{action="${action}",result="${result}"}`);
}

export function getMetricsSnapshot() {
  return {
    startedAt,
    counters: Array.from(counters.entries()),
  };
}

export function metricsAsPrometheus(): string {
  const lines = [
    "# HELP app_uptime_seconds Application uptime in seconds",
    "# TYPE app_uptime_seconds gauge",
    `app_uptime_seconds ${Math.floor((Date.now() - startedAt) / 1000)}`,
  ];

  for (const [key, value] of counters.entries()) {
    const metricName = key.includes("{") ? key.split("{")[0] : key;
    lines.push(`# TYPE ${metricName} counter`);
    lines.push(`${key} ${value}`);
  }

  return lines.join("\n");
}
