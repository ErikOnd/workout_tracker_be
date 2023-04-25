import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import { UserDocument, UserModel } from "../../interfaces/userInterface";

const UsersSchema = new Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: false },
    email: { type: String, required: true },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dyy38u8x7/image/upload/v1682436708/workoutTracker/blank-profile-picture-g64029973a_640_khl6e3.png",
    },
    googleId: { type: String },
  },
  { timestamps: true }
);

UsersSchema.pre("save", async function () {
  const newUserData = this;
  if (newUserData.isModified("password")) {
    const plainPW = newUserData.password;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPW!, salt);
    newUserData.password = hash;
  }
});

UsersSchema.methods.toJSON = function () {
  const currentUserDocument = this;
  const currentUser = currentUserDocument.toObject();
  delete currentUser.password;
  delete currentUser.__v;
  return currentUser;
};

UsersSchema.static("checkCredentials", async function (email, plainPW) {
  const user = await this.findOne({ email });

  if (user) {
    const passwordMatch = await bcrypt.compare(plainPW, user.password);

    if (passwordMatch) {
      // If passwords match --> return user
      return user;
    } else {
      //If they don't --> return null
      return null;
    }
  } else {
    //In case of also user not found --> return null
    return null;
  }
});

export default model<UserDocument, UserModel>("User", UsersSchema);
