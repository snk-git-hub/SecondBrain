import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: String,
  password: String
});
const ContentSchema = new mongoose.Schema({
  title: String,
  link: String,
  type: { type: String },
  tags: [String],
  userId: mongoose.Schema.Types.ObjectId
});
const LinkSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  hash: String
});

export const UserModel = mongoose.model("Brain", UserSchema);
export const ContentModel = mongoose.model("Content", ContentSchema);
export const LinkModel = mongoose.model("Link", LinkSchema);
