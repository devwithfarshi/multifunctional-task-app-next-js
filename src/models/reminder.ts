import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import { dbConnect } from "@/lib/db";

export type ReminderStatus = "scheduled" | "sent" | "cancelled";
export type ReminderChannel = "email";

export interface IReminder {
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  scheduledAt: Date;
  status: ReminderStatus;
  channel: ReminderChannel;
  timezone: string;
  processedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReminderDocument extends IReminder, Document {
  _id: Types.ObjectId;
}

export type CreateReminderInput = Pick<
  IReminder,
  "taskId" | "userId" | "scheduledAt" | "channel" | "timezone"
> &
  Partial<Pick<IReminder, "status" | "processedAt">>;

export type UpdateReminderInput = Partial<
  Pick<
    IReminder,
    "scheduledAt" | "status" | "channel" | "timezone" | "processedAt"
  >
>;

const reminderSchema = new Schema<ReminderDocument, ReminderModel>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "sent", "cancelled"],
      default: "scheduled",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["email", "push", "sms"],
      required: true,
    },
    timezone: {
      type: String,
      required: true,
      trim: true,
    },
    processedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "reminders",
  }
);

reminderSchema.index({ userId: 1, status: 1 });
reminderSchema.index({ taskId: 1, scheduledAt: 1 });

export interface ReminderModel extends Model<ReminderDocument> {
  scheduleReminder(input: CreateReminderInput): Promise<ReminderDocument>;
  getPendingReminders(before: Date): Promise<ReminderDocument[]>;
  markProcessed(
    id: string | Types.ObjectId,
    when?: Date
  ): Promise<ReminderDocument | null>;
  cancelReminder(id: string | Types.ObjectId): Promise<ReminderDocument | null>;
  deleteReminder(id: string | Types.ObjectId): Promise<boolean>;
}

reminderSchema.statics.scheduleReminder = async function (
  this: ReminderModel,
  input: CreateReminderInput
): Promise<ReminderDocument> {
  await dbConnect();
  const payload: CreateReminderInput = {
    status: "scheduled",
    processedAt: null,
    ...input,
  };
  return this.create(payload);
};

reminderSchema.statics.getPendingReminders = async function (
  this: ReminderModel,
  before: Date
): Promise<ReminderDocument[]> {
  await dbConnect();
  return this.find({ status: "scheduled", scheduledAt: { $lte: before } })
    .sort({ scheduledAt: 1 })
    .exec();
};

reminderSchema.statics.markProcessed = async function (
  this: ReminderModel,
  id: string | Types.ObjectId,
  when?: Date
): Promise<ReminderDocument | null> {
  await dbConnect();
  const processedAt = when ?? new Date();
  return this.findByIdAndUpdate(
    id,
    { status: "sent", processedAt },
    { new: true }
  ).exec();
};

reminderSchema.statics.cancelReminder = async function (
  this: ReminderModel,
  id: string | Types.ObjectId
): Promise<ReminderDocument | null> {
  await dbConnect();
  return this.findByIdAndUpdate(
    id,
    { status: "cancelled" },
    { new: true }
  ).exec();
};

reminderSchema.statics.deleteReminder = async function (
  this: ReminderModel,
  id: string | Types.ObjectId
): Promise<boolean> {
  await dbConnect();
  const res = await this.findByIdAndDelete(id).exec();
  return Boolean(res);
};

const ReminderModel =
  (models.Reminder as ReminderModel) ||
  model<ReminderDocument, ReminderModel>("Reminder", reminderSchema);

export default ReminderModel;
export { reminderSchema };
