import dotenv from 'dotenv'
import connectDB from "./db/index.js";
dotenv.config({
    path: './env'
})

import { app } from "./app.js"

connectDB()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("Mongodb Connection failed ", err);
    })



/*
( async ()=>{
    try{
        await mongoose.connect(`${process.env.MOGODB_URI}/${DB_NAME}`);
        app.on("error", (error)=>{
            console.log("mongodb connection failed: ", error);
            throw error;
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`mongodb connected on ${process.env.PORT}`);
        })
    } catch (error){
        console.error("error:", error );
        throw error   
    }
})()  */
