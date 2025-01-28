import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const verifyJwt = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        //check for debugging purpose 
        console.log(token);  
        console.log("Type of token:", typeof token);
        console.log("Token is empty:", !token); 
              
        if (typeof token !== 'string') {
            throw new ApiError(401, "Access Token must be a string");
        }
        
        if (!token) {
            throw new ApiError(401, "Invalid Access Token");
        }
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, "Invali access token")
        }
        req.user = user
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized access")

    }
})
export default verifyJwt;