import Router from "express";
import { registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
} from '../controllers/user.controller.js';
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

// secured routes ?
route.post("/logout", verifyJwt, logoutUser)
route.post("/refresh-token", refreshAccessToken)
route.post("/change-password", verifyJwt, changeCurrentPassword)
route.get("/current-user", verifyJwt, getCurrentUser )
route.patch("/update-account", verifyJwt, updateAccountDetails)

route.patch("/avatar", verifyJwt, upload.single("avatar"), updateUserAvatar)
route.patch("/cover-image", verifyJwt, upload.single("/coverImage"), updateUserCoverImage)
route.get("/c/:username", verifyJwt, getUserChannelProfile)
route.get("/watch-history", verifyJwt, getWatchHistory)



export default route