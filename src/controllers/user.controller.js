import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import mongoose from "mongoose";


/*
steps to approach business logic 
get the user details from frontend
validate user input (validation) -  it should not empty
check if user already exists in database - username, email
check for images, avatar
upload them to cluodinaty , avatar
create a new user object  in database
remove the password and refresh token field from response
check for user creation
send the response back to frontend
handle errors and exceptions */


const generateAccessAndRefresherTokens = async (userId) => {

  try {
    const user = await User.findById(userId);
    const accessToken =  user.generateAccess()
    const refreshToken = user.generateRefreshToken()
    console.log(refreshToken);  
    console.log("Type of refreshToken:", typeof refreshToken); // Log the type of the token
   


    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating and refresh access token")
  }

}



const registerUser = asyncHandler(async (req, res) => {

  try {
    // 1. validation
    const { userName, email, fullName, password } = req.body;
    // console.log(email, password);

    // check user creadentials
    /* if(!userName || !email || !fullName || !password) {
     return res.status(400).json( {msg: "Please fill in all fields"} );
   } */

    // or
    if ([userName, email, fullName, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required")
    }
    // 2. check if user already exists in database
    // const existingUser = await User.findOne({ where: { userName, email } });
    const existingUser = await User.findOne({
      $or: [{ fullName }, { email }]
    });


    if (existingUser) {
      throw new ApiError(400, "Username or email already exists");
    }

    // 3. check if avatar and coverImage are provided
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
    }

    // if (req.files && req.files.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path;
    // } else {
    //     throw new ApiError(400, "Cover image is required");
    // }


    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }
    // 4. upload avatar and coverImage to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
      throw new ApiError(400, "Avatar upload failed");
    }
    // 5. create a new user object in database
    const user = await User.create({
      userName: userName.toLowerCase(),
      email,
      fullName,
      password,
      avatar: avatar?.url,
      coverImage: coverImage?.url || ""
    })

    // remove the password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
      throw new ApiError(404, "User not found")
    }


    // send response to user
    return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered Successfully")
    )

  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal Server Error");
  }

})

// write steps to approach business logic for loginUser
/* get user creadentials 
 Validate creadentials
 check if user exist
 if user exist check if password is correct
 if password is correct generate token and send response to user */

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, userName, password } = req.body;

    // 1. validate user credentials
    if (!(email || userName)) {
      throw new ApiError(400, "email or userName are required")
    }
    // 2. check if user exist
    // const user = await User.findOne( { email: email.toLowerCase()});
    const user = await User.findOne({
      $or: [{ userName }, { email }]
    })
    if (!user) {
      throw new ApiError(404, "user not found")
    }
    console.log(user);

    // 3. check if password is correct
    const isValidPassword = await user.isPasswordCorrect(password);
    if (!isValidPassword) {
      throw new ApiError(401, "Invalid password")
    }

    // 4. generate token and send response to user
    const { accessToken, refreshToken } = await generateAccessAndRefresherTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
      httpOnly: true,
      secure: true
    }

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200, {
          user: loggedInUser, accessToken, refreshToken
        },
          "user logged in successfully"
        )
      )


  } catch (error) {
    throw new ApiError(500, error.message || "User login failed")

  }
})

// logout business logic ?
const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: { refreshToken: 1 },

      },
      { new: true }
    )

    const options = {
      httpOnly: true,
      secure: true
    }

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
        new ApiResponse(200, {}, "User logged out successfully")
      )

  } catch (error) {
    throw new ApiError(500, error.message || "User logout failed")
  }
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request ")

  }
  try {

    const decodeToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_SECRET_KEY)
    const user = await User.findById(decodeToken._id)

    if (!user) {
      throw new ApiError(401, "Unauthorized request")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Unauthorized request")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, newRefreshToken } = generateAccessAndRefresherTokens(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200,
          {
            accessToken,
            refreshToken: newRefreshToken
          },
          "Access token refreshed successfully"
        )
      )

  } catch (error) {
    throw new ApiError(500, error.message, "Access token refresh failed")

  }

})

// change password business logic
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  const user = await User.findById(req.user?._id)
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(
      new ApiResponse(200,
        {}, "Password changed successfully"
      )
    )
})

// get currentUser
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200)
    .json(
      new ApiResponse(200, req.user, "Current user retrieved successfully")
    )
})

// updateAccount details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body

  if (!(fullName || email)) {
    throw new ApiError(400, "Please enter valid details")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email: email } },
    { new: true }
  ).select("-password")

  return res.status(200)
    .json(
      new ApiResponse(200, user, "Account details updated successfully")
    )
})

// update avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading file")
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password")

  return res.status(200)
    .json(
      new ApiResponse(200, user, "Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover image file is missing")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading file")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password")
  return res.status(200)
    .json(
      new ApiResponse(200, user, "Cover image updated successfully")
    )
})

// getUserChannelProfile  ?
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params

  if (!userName?.trim()) {
    throw new ApiError(400, "User name is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addField: {

        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false

          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1

      }
    }
  ])

  if (!channel?.length) {
    throw new ApiError(401, "Channel not found ")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    )


})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    function: 1,
                    userName: 1,
                    avatar: 1
                  }
                }
              ]
            },
            $addFields: {
              owner: { $first: "$owner" }
            }
          }
        ]
      }
    }
  ])

  if (!user.length) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200)
    .json(
      new ApiResponse(200, user[0].watchHistory, "User watch history fetched successfully")
    )
})


export {
  registerUser,
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
}