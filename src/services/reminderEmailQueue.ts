import "dotenv/config";
import { Queue, Worker, QueueEvents, type JobsOptions } from "bullmq";
import transporter from "../config/email";
import { redisOptions } from "../config/redisConfig";
import { ReminderModel, TaskModel, UserModel } from "../models";
import type { ReminderDocument } from "../models/reminder";
import logger from "../lib/logger";

const REMINDER_QUEUE_NAME = "reminder-email-queue";
const SCAN_INTERVAL_MS = 120_000;
const BATCH_SIZE = 50;
const FROM_EMAIL = process.env.EMAIL_USER;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function sendReminderEmail(reminder: ReminderDocument): Promise<boolean> {
  try {
    const [user, task] = await Promise.all([
      UserModel.findById(reminder.userId).select("email name").lean().exec(),
      TaskModel.findById(reminder.taskId)
        .select("title description dueDate")
        .lean()
        .exec(),
    ]);

    if (!user || typeof user.email !== "string" || user.email.trim() === "") {
      logger.warn("Skipped reminder: user or email missing", {
        reminderId: String(reminder._id),
        userId: String(reminder.userId),
      });
      return false;
    }

    const subject = `Task Reminder: ${task?.title ?? "Your Task"}`;

    const scheduledLocale = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: reminder.timezone,
    }).format(new Date(reminder.scheduledAt));

    const textBody = [
      `Hello ${user.name ?? ""}`.trim(),
      "",
      `This is a reminder for your task: ${task?.title ?? "(untitled)"}.`,
      task?.description ? `Description: ${task.description}` : undefined,
      task?.dueDate
        ? `Due: ${new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: reminder.timezone,
          }).format(new Date(task.dueDate))}`
        : undefined,
      `Scheduled at: ${scheduledLocale} (${reminder.timezone})`,
    ]
      .filter(Boolean)
      .join("\n");

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: user.email,
      subject,
      text: textBody,
    });

    await ReminderModel.markProcessed(reminder._id);
    return true;
  } catch (err) {
    logger.error("Failed to send reminder email", err, {
      reminderId: String(reminder._id),
      userId: String(reminder.userId),
      taskId: String(reminder.taskId),
    });
    return false;
  }
}

async function scanAndProcessReminders(): Promise<{
  total: number;
  processed: number;
  failed: number;
}> {
  const now = new Date();
  const reminders = await ReminderModel.getPendingReminders(now);
  if (!reminders.length) {
    return { total: 0, processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  const chunks = chunkArray(reminders, BATCH_SIZE);
  for (const group of chunks) {
    const results = await Promise.allSettled(
      group.map((reminder) => sendReminderEmail(reminder))
    );
    for (const res of results) {
      if (res.status === "fulfilled" && res.value) processed += 1;
      else failed += 1;
    }
  }

  return { total: reminders.length, processed, failed };
}

export function startReminderEmailQueue(): {
  queue: Queue;
  worker: Worker;
  events: QueueEvents;
} {
  const queue = new Queue(REMINDER_QUEUE_NAME, { connection: redisOptions });
  const events = new QueueEvents(REMINDER_QUEUE_NAME, {
    connection: redisOptions,
  });

  const worker = new Worker(
    REMINDER_QUEUE_NAME,
    async () => {
      try {
        const summary = await scanAndProcessReminders();
        logger.info("Reminder scan completed", summary);
        return summary;
      } catch (err) {
        logger.error("Reminder scan failed", err);
        throw err;
      }
    },
    { connection: redisOptions, concurrency: 1 }
  );

  worker.on("failed", (job, err) => {
    logger.error("Worker job failed", err, { jobId: job?.id, name: job?.name });
  });
  worker.on("completed", (job, result) => {
    logger.info("Worker job completed", { jobId: job?.id, result });
  });

  const repeatOptions: JobsOptions = {
    repeat: { every: SCAN_INTERVAL_MS },
    removeOnComplete: { age: 60, count: 100 },
    removeOnFail: { age: 300, count: 100 },
    jobId: "scan-reminders",
  };

  queue.add("scan-reminders", {}, repeatOptions).then(() => {
    logger.info("Repeatable reminder scan job scheduled", {
      intervalMs: SCAN_INTERVAL_MS,
      batchSize: BATCH_SIZE,
      queue: REMINDER_QUEUE_NAME,
    });
  });

  logger.info("Reminder email queue initialized", {
    queue: REMINDER_QUEUE_NAME,
    intervalMs: SCAN_INTERVAL_MS,
    batchSize: BATCH_SIZE,
  });

  return { queue, worker, events };
}

export default startReminderEmailQueue;
