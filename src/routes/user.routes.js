import Router from "express";
import { registerUser } from '../controllers/user.controller.js';
import { loginUser,logoutUser , refreshAccessToken} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from '../middlewares/auth.middileware.js'

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

route.post("/login", loginUser)

// secured routes
route.post("/logout", verifyJwt, logoutUser)
route.post("/refresh-token", refreshAccessToken)



export default route