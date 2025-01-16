// require (dotenv) .config() 

import dotenv from 'dotenv'
import connectDB from "./db/index.js";
dotenv.config({
    path: './env'
})



connectDB()
.then(()=>{
    console.log("connected to database")
})
.catch((err)=>{
    console.log("Connection failed ", err);
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