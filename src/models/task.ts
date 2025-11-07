import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
  PaginateModel,
} from "mongoose";
import { dbConnect } from "@/lib/db";
import mongoosePaginate from "mongoose-paginate-v2";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high";

export interface ITask {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  reminderEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskDocument extends ITask, Document {
  _id: Types.ObjectId;
}

export type CreateTaskInput = Pick<ITask, "userId" | "title"> &
  Partial<
    Pick<
      ITask,
      "description" | "status" | "priority" | "dueDate" | "reminderEnabled"
    >
  >;

export type UpdateTaskInput = Partial<
  Pick<
    ITask,
    | "title"
    | "description"
    | "status"
    | "priority"
    | "dueDate"
    | "reminderEnabled"
  >
>;

const taskSchema = new Schema<TaskDocument, TaskModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Title must be at most 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Description must be at most 2000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    reminderEnabled: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "tasks",
  }
);

taskSchema.index({ userId: 1, status: 1 });

export interface TaskModel extends Model<TaskDocument> {
  createTask(input: CreateTaskInput): Promise<TaskDocument>;
  getTasksByUser(userId: string | Types.ObjectId): Promise<TaskDocument[]>;
  updateTaskById(
    id: string | Types.ObjectId,
    updates: UpdateTaskInput
  ): Promise<TaskDocument | null>;
  deleteTaskById(id: string | Types.ObjectId): Promise<boolean>;
  toggleReminder(
    id: string | Types.ObjectId,
    enabled: boolean
  ): Promise<TaskDocument | null>;
}

taskSchema.statics.createTask = async function (
  this: TaskModel,
  input: CreateTaskInput
): Promise<TaskDocument> {
  await dbConnect();
  const payload: CreateTaskInput = {
    status: "pending",
    reminderEnabled: false,
    priority: "medium",
    ...input,
  };
  return this.create(payload);
};

taskSchema.statics.getTasksByUser = async function (
  this: TaskModel,
  userId: string | Types.ObjectId
): Promise<TaskDocument[]> {
  await dbConnect();
  return this.find({ userId }).sort({ createdAt: -1 }).exec();
};

taskSchema.statics.updateTaskById = async function (
  this: TaskModel,
  id: string | Types.ObjectId,
  updates: UpdateTaskInput
): Promise<TaskDocument | null> {
  await dbConnect();
  return this.findByIdAndUpdate(id, updates, { new: true }).exec();
};

taskSchema.statics.deleteTaskById = async function (
  this: TaskModel,
  id: string | Types.ObjectId
): Promise<boolean> {
  await dbConnect();
  const res = await this.findByIdAndDelete(id).exec();
  return Boolean(res);
};

taskSchema.statics.toggleReminder = async function (
  this: TaskModel,
  id: string | Types.ObjectId,
  enabled: boolean
): Promise<TaskDocument | null> {
  await dbConnect();
  return this.findByIdAndUpdate(
    id,
    { reminderEnabled: Boolean(enabled) },
    { new: true }
  ).exec();
};

taskSchema.plugin(mongoosePaginate as any)

const TaskModel =
  (models.Task as TaskModel) ||
  model<TaskDocument, TaskModel>("Task", taskSchema);

export default TaskModel;
export { taskSchema };
