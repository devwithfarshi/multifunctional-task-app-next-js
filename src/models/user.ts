import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import { dbConnect } from "@/lib/db";

export type UserRole = "user" | "admin";
export type AuthProvider = "credentials" | "google";

export interface IUser {
  name: string;
  email: string;
  passwordHash?: string | null;
  role: UserRole;
  provider?: AuthProvider;
  emailVerified?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

export type CreateUserInput = Pick<IUser, "name" | "email"> &
  Partial<Pick<IUser, "passwordHash" | "role" | "emailVerified" | "provider">>;

export type UpdateUserInput = Partial<
  Pick<IUser, "name" | "email" | "role" | "emailVerified" | "provider">
>;

const emailRegex =
  /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3})\])$/;

const userSchema = new Schema<UserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, "Email format is invalid"],
    },
    passwordHash: {
      type: String,
      required: false,
      default: null,
      minlength: [60, "Password hash must be a valid hash"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
      required: false,
      lowercase: true,
      trim: true,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

userSchema.index({ email: 1 }, { unique: true });

export interface IUserModel extends Model<UserDocument> {
  createUser(input: CreateUserInput): Promise<UserDocument>;
  findByEmail(email: string): Promise<UserDocument | null>;
  updateUserById(
    id: string | Types.ObjectId,
    updates: UpdateUserInput
  ): Promise<UserDocument | null>;
  deleteUserById(id: string | Types.ObjectId): Promise<boolean>;
}

userSchema.statics.createUser = async function (
  this: IUserModel,
  input: CreateUserInput
): Promise<UserDocument> {
  await dbConnect();
  const payload: CreateUserInput = {
    role: "user",
    provider: input.provider ?? "credentials",
    ...input,
  };
  return this.create(payload);
};

userSchema.statics.findByEmail = async function (
  this: IUserModel,
  email: string
): Promise<UserDocument | null> {
  await dbConnect();
  return this.findOne({ email }).exec();
};

userSchema.statics.updateUserById = async function (
  this: IUserModel,
  id: string | Types.ObjectId,
  updates: UpdateUserInput
): Promise<UserDocument | null> {
  await dbConnect();
  return this.findByIdAndUpdate(id, updates, { new: true }).exec();
};

userSchema.statics.deleteUserById = async function (
  this: IUserModel,
  id: string | Types.ObjectId
): Promise<boolean> {
  await dbConnect();
  const res = await this.findByIdAndDelete(id).exec();
  return Boolean(res);
};

const UserModel: IUserModel =
  (models.User as IUserModel) ||
  model<UserDocument, IUserModel>("User", userSchema);
export default UserModel;
export { userSchema };
