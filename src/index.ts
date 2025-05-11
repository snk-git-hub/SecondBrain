import dotenv from 'dotenv'
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { array, z } from "zod";
import bcrypt, { hash } from "bcrypt";
import { User, Content, Tag, Link } from "./db"; 
import connectDB from "./db";
import { emit, title } from 'process';
import {nanoid} from 'nanoid';
const app = express();
app.use(express.json());
connectDB(); 
const signupSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(10, "Username cannot exceed 10 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password cannot exceed 20 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 
      "Password must contain at least one uppercase, one lowercase, and one number"),
  email: z.string().email("Please enter a valid email address")
});
const signinSchema=z.object({
  email:z.string().email("invalid email address"),
  password:z.string().min(1,"password is requiresd")
})
const constentsschema=z.object({
  title:z.string().min(1,""),
  link :z.string().url(""),
  type :z.enum(["document", "tweet", "youtube", "link"]),
  tags :z.array(z.string()).nonempty(""),
})
app.post("/api/v1/signup", async (req, res) => {
  const validationResult = signupSchema.safeParse(req.body);
  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }
  try {
    const existingUser = await User.findOne({ 
      $or: [
        { username: req.body.username },
        { email: req.body.email }
      ]
    });
    if (existingUser) {
   res.status(409).json({
        success: false,
        message: "Username or email already exists"
      });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      username: req.body.username,email: req.body.email,password: hashedPassword
    });
    const token = jwt.sign(
      { userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' }
    );
 res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        userId: user._id,
        token,
        username: user.username
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
 res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
app.post("/api/v1/signin", async (req, res) => {
  const validation = signinSchema.safeParse(req.body);
  if (!validation.success) {
      res.status(400).json({
      success: false,
      message: "Validation failed",     
    });
  }
const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
 if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
  res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        userId: user._id,
        token,
        username: user.username
      }
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
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


// todo make the file structure 

