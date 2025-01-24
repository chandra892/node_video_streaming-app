import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replae("Bearer ", "")
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Invalid Access Token")
        }
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY)

        const user = User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            //Todo: 
            throw new ApiError(401, "Invali access token")
        }
        req.user = user
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized access")

    }
})
export default verifyJwt;