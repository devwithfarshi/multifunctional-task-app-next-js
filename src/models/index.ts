export { default as UserModel, userSchema } from "./user";
export type { IUser, UserDocument, CreateUserInput, UpdateUserInput, UserRole } from "./user";

export { default as TaskModel, taskSchema } from "./task";
export type {
  ITask,
  TaskDocument,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  TaskPriority,
} from "./task";

export { default as ReminderModel, reminderSchema } from "./reminder";
export type {
  IReminder,
  ReminderDocument,
  CreateReminderInput,
  UpdateReminderInput,
  ReminderStatus,
  ReminderChannel,
} from "./reminder";