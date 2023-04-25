import { Model, Document } from "mongoose";

interface User {
  username: string;
  password: string;
  email: string;
  avatar: string;
  googleId: string;
}

export interface UserDocument extends User, Document {}

export interface UserModel extends Model<UserDocument> {
  checkCredentials(
    email: string,
    password: string
  ): Promise<UserDocument | null>;
}
