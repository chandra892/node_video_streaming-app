import express from 'express'
const app = express();
import cors from 'cors';
import cookieParser from 'cookie-parser';

app.use(cors({
    origin: process.env.CORS_ORIGIN,
}))

app.use(express.json({limit: "16kb"}));
app.use(express.static("public"));
app.use(express.urlencoded({extended: true, limit:'1kb'}))
app.use(cookieParser());


// import rotes 
import userRouter from './routes/user.routes.js'


// declare routes here
app.use("/api/v1/users", userRouter)

// http://localhost:8000/api/v1/users/register
















export { app }