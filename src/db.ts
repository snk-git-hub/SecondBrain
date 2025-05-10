import mongoose, { Schema, model, connect } from "mongoose";
import dotenv from 'dotenv';

const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [10, 'Username cannot exceed 10 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    maxlength: [20, 'Password cannot exceed 20 characters'],
    select: false 
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  }
}, { 
  timestamps: true 
});

const ContentSchema = new Schema({
  title: {
    type: String,enum:["document", "tweet", "youtube", "link"],
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  link: {
    type: String,
    required: [true, 'URL is required'],
    match: [/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL'],
    trim: true
  },
  type: {
    type: String,
    enum: ['article', 'video', 'image', 'document', 'other'],
    default: 'article'
  },
  userId: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, { timestamps: true });

const TagSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Tag title is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }
}, { timestamps: true });

const LinkSchema = new Schema({
  hash: {
    type: String,
    required: [true, 'Hash is required'],
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'User reference is required']
  }
}, { timestamps: true });

export const User = model('User', UserSchema);
export const Content = model('Content', ContentSchema);
export const Tag = model('Tag', TagSchema); 
export const Link = model('Link', LinkSchema); 




const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    throw new Error('MONGO_URI must be defined in environment variables');
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    maxPoolSize: 50,
    ssl: true,
    authSource: 'admin'
  };

  try {
    await mongoose.connect(mongoUri, options);
    console.log('MongoDB connection established');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  }
};

export default connectDB;