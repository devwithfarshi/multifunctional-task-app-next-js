type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
const CURRENT_LEVEL: LogLevel = ["debug", "info", "warn", "error"].includes(
  envLevel
)
  ? (envLevel as LogLevel)
  : "info";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[CURRENT_LEVEL];
}

function format(level: LogLevel, message: string, meta?: unknown): string {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta !== undefined ? { meta } : {}),
  };
  return JSON.stringify(payload);
}

export const logger = {
  debug(message: string, meta?: unknown): void {
    if (!shouldLog("debug")) return;
    console.debug(format("debug", message, meta));
  },
  info(message: string, meta?: unknown): void {
    if (!shouldLog("info")) return;
    console.info(format("info", message, meta));
  },
  warn(message: string, meta?: unknown): void {
    if (!shouldLog("warn")) return;
    console.warn(format("warn", message, meta));
  },
  error(message: string, error?: unknown, meta?: unknown): void {
    if (!shouldLog("error")) return;
    const payload = meta === undefined ? error : { error, meta };
    console.error(format("error", message, payload));
  },
};

export default logger;