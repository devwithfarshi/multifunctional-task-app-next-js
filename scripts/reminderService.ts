import "dotenv/config";
import logger from "../src/lib/logger";
import startReminderEmailQueue from "../src/services/reminderEmailQueue";

const { queue, worker, events } = startReminderEmailQueue();

logger.info("Reminder service started", {
  pid: process.pid,
});

async function shutdown(code = 0) {
  try {
    logger.info("Shutting down reminder service");
    await Promise.all([
      worker.close().catch((err) => logger.error("Worker close failed", err)),
      queue.close().catch((err) => logger.error("Queue close failed", err)),
      events.close().catch((err) => logger.error("Events close failed", err)),
    ]);
  } finally {
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception in reminder service", err);
  shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection in reminder service", reason);
});
