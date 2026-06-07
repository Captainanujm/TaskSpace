import mongoose from "mongoose";
import dotenv from "dotenv"
const connectDb=async ()=>{
    try{
         await mongoose.connect(process.env.MONGO_URI);
         console.log("MongoDB connected");
    }catch(error){
        console.log(error.message);
    }
   

}
export default connectDb;