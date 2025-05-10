import { match } from "assert";
import { kMaxLength } from "buffer";
import mongoose, { Schema ,model,connect} from "mongoose";
import { title } from "process";

const UsersSchema =new Schema({
  username:{type:String,
            required:true,
            unique:true,
            minlenght:[3,'must have 3'],
            maxLength:[10,'cnnot exide 10'],
            match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
            trim:true
          },


  password:{type:String,
    required:true,
    minlengh:[8,'must have have 8 ']},
    maxLength:[20,'cannot exceed more than 20']
  })

const contentSchema = new Schema({
  link:{type:String,
    match:[ /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    'Please enter a valid URL'],
  },
  
  type:{type:String},
  title:{type:String},
  userid:{type:mongoose.Types.ObjectId ,ref:'User'}
})

const tageSchema = new Schema({
  title:{type:String}
})

const LinkSchema =new Schema({
  hash:{type:String},
  userId:{type:String,ref:'User'}
})

const User=model('User',UsersSchema)
const Content=model('Content',contentSchema)
const Tag=model('tag',tageSchema)
const link=model('Link',LinkSchema)

 const connectDB=async()=>{
  try{
    mongoose.connect('mongodb+srv://shivanandu2k3:zshCErgrFjmtaIXW@cluster0.v6voy.mongodb.net/todo-app')
    console.log("mongo connecting ")
  }
  catch(error){
    console.log("mongo connecting filed")
    console.log(error)
  }
 }
