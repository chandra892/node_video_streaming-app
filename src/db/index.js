import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB  = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Mongodb is connected, ${connectionInstance.connection.host}`);

    } catch (err) {
        console.error("Mongodb Connection Failed", err);
        process.exit(1);
        
    }

}

export default connectDB;