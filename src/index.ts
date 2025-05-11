import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import connectDB from './db';
import { UserModel, ContentModel, LinkModel } from './models';
import userMiddleware from './middleware';
import random from './utils';

const app = express();
app.use(express.json());

connectDB();

const signupSchema = z.object({
  username: z.string()
    .min(3)
    .max(10)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  password: z.string()
    .min(8)
    .max(20)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 
      "Password must have uppercase, lowercase, and number"),
});

const signinSchema = z.object({
  username: z.string().min(3).max(10).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(1, "Password required"),
});

const contentSchema = z.object({
  title: z.string().min(1),
  link: z.string().url(),
  type: z.enum(["document", "tweet", "youtube", "link"]),
  tags: z.array(z.string()).nonempty(),
});

app.post("/api/v1/signup", async (req: Request, res: Response) => {
  const validation = signupSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      errors: validation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  try {
    const existingUser = await UserModel.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await UserModel.create({
      username: req.body.username,
      password: hashedPassword
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    res.status(201).json({
      success: true,
      data: { userId: user._id, token, username: user.username }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/v1/signin", async (req: Request, res: Response) => {
  const validation = signinSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, message: "Validation failed" });
  }

  const { username, password } = req.body;
  try {
    const user = await UserModel.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    res.status(200).json({
      success: true,
      data: { userId: user._id, token, username: user.username }
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/v1/content", userMiddleware, async (req, res) => {
  const link = req.body.link;
  const type = req.body.type;
  await ContentModel.create({
      link,
      type,
      title: req.body.title,
      userId: req.userId,
      tags: []
  })

  res.json({
      message: "Content added"
  })
  
})

app.get("/api/v1/content", userMiddleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;
  const content = await ContentModel.find({
      userId: userId
  }).populate("userId", "username")
  res.json({
      content
  })
})

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  const contentId = req.body.contentId;

  await ContentModel.deleteMany({
      contentId,
      userId: req.userId
  })

  res.json({
      message: "Deleted"
  })
})

app.post("/api/v1/brain/share", userMiddleware, async (req: any, res: Response) => {
  try {
    const { share } = req.body;

    if (share) {
      const existing = await LinkModel.findOne({ userId: req.userId });
      if (existing) return res.json({ hash: existing.hash });

      const hash = random(10);
      await LinkModel.create({ userId: req.userId, hash });

      return res.json({ hash });
    } else {
      await LinkModel.deleteOne({ userId: req.userId });
      return res.json({ message: "Removed link" });
    }
  } catch (err) {
    console.error("Error sharing:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/v1/brain/:shareLink", async (req: Request, res: Response) => {
  try {
    const link = await LinkModel.findOne({ hash: req.params.shareLink });
    if (!link) return res.status(404).json({ message: "Link not found" });

    const [user, content] = await Promise.all([
      UserModel.findById(link.userId),
      ContentModel.find({ userId: link.userId })
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ username: user.username, content });
  } catch (err) {
    console.error("Error fetching:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
