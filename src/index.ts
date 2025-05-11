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
app.post("/api/v1/content",(req,res)=>{
  try{
    const contentvalidation = constentsschema.safeParse(req.body);
if(!contentvalidation .success){
 return  res.status(400).json({
    message:"validtion failed",
  })}
const token=req.body.token;
if(!token){
  return res.status(401).json({ message: "Token missing" });
}
 let decode = jwt.verify(token,'secret')
if(!decode){
  res.status(404).json({
    message:"autentication fail"
  })
}
 const { title, link, type, tags } = req.body;
 const content = await Content.create({ title, link, type, tags });
 return res.status(201).json({
  message:"content created ",
  content
 })}
  catch(error){
 res.status(500).json({
  message:""
 })} 
})
app.get("/api/v1/getoncontent",(req,res)=>{
  try{
    const token =req.body.Token
const valid = jwt.verify(token,'secret')
if(!token){
  return res.status(401).json({message:"token missing "})
}
    const {type,tag}=req.query;
    const query : any ={};
    if(type) query.type=type
    if(tag) query.type=tag
    const content =await Content.find(query);
    return res.status(200).json({
      message: "Content fetched successfully",
      data: content
    });
  }
  catch(error){
    console.error("Get content error:", error);
    res.status(500).json({ message: "Internal server error" });
  }  
})
app.post("/api/v1/deleateoncontent",(req,res)=>{
try{
const token =req.body.Token
  if(!token){
res.status(401).json({
  message:"token not find"
})
}
  const{type,tag}=req.query;
  const query: any ={};
  if(type) query.type=type
  if(tag)  query.tg=tag
  const result =await Content.deleteMany(query);
if(result.deletedCount===0){
  res.status(404).json({
    message:"content not found"
  })
}
res.status(200).json({
  success: true,
  message: `${result.deletedCount} content(s) deleted successfully`,
});
} catch (error) {
console.error("Delete error:", error);
res.status(500).json({
  success: false,
  message: "Internal server error",
});
}    
})




app.post("/api/v1/brain/share",(req,res)=>{
    
try{
  const {contentId}=req.body;
  const token =req.body.teken;
  if(!token) return res.status(401).json({message:'Token is missing'});
  const valid = jwt.verify(token,'secret')as jwt.JwtPayload;
  const userId =valid.userId;


  const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });

    const shareLink = nanoid(10);

    const shared = await Link.create({
      hash: shareLink,
      userId: userId
    });
    res.status(201).json({
      message: "Share link created",
      link: `/api/v1/brain/${shareLink}`,
    })
  } catch(error){

    console.error("Share error:", error);
    res.status(500).json({ message: "Internal server error" });console.error("Share error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
  
})
app.post("/api/v1/brain/:shareLink",(req,res)=>{

  try{
    const {shareLink}=req.params;
   const shared =await Link.findOne({link:shareLink}).populate('content')

   if (!shared) {
    return res.status(404).json({ message: "Shared content not found" });
  }

  res.status(200).json({
    message: "Shared content fetched successfully",
    content: shared.content,
  });

  }catch(error){

    console.error("Fetch share error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
    
})
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
