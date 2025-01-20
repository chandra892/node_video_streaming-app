import Router from "express";
import { registerUser } from '../controllers/user.controller.js';
import { upload } from "../middlewares/multer.middleware.js";

const route = Router()

route.post("/register", upload.fields(
    [{
        name: "coverImage",
        maxCount: 1
    },
    {
        name: "avatar",
        maxCount: 1
    }]
), registerUser)



export default route