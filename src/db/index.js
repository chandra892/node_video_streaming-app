import mongoose from "mongoose";
import express from "express";
const app = express();
import { DB_NAME } from "../constants.js";


const connectDB  = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Mongodb is connected, ${connectionInstance.connection.host}`);
        app.listen(process.env.PORT, ()=>{
            console.log(`Server is running on port ${process.env.PORT} `);
        })

    } catch (err) {
        console.error("Mongodb Connection Failed", err);
        process.exit(1);
        
    }

}

export default connectDB;