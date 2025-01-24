import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

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
    const accessToken = user.generateAcess()
    const refreshToken = user.generateRefreshToken()
    
    user.refreshToken = refreshToken
    await user.save( { validateBeforeSave })
  
    return { accessToken, refreshToken }
  
} catch (error) {
  throw new ApiError(500, "Something went wrong while generating refresh and access token")
  
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
    if(req.files && Array.isArray(req.files.coverImage ) && 
     req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path;
     }
    

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

   const loginUser = asyncHandler( async (req, res)=>{
    try{
      const {email, userName,  password } = req.body;
      // 1. validate user credentials
      if ( !( email || userName ) ) {
        throw new ApiError(400, "email or userName are required")
      }
      // 2. check if user exist
      // const user = await User.findOne( { email: email.toLowerCase()});
      const user = await User.findOne({
        $or: [ {userName }, {email} ]
      })
      if(!user){
        throw new ApiError(404, "user not found")
      }
      // 3. check if password is correct
      const isValidPassword = await user.isPasswordCorrect(password);
      if(!isValidPassword){
        throw new ApiError(401, "Invalid password")
      }
      // 4. generate token and send response to user
      const {accessToken, refreshToken} = await generateAccessAndRefresherTokens(user._id)

     const loggedInUser = User.findById(user._id).select("-password -refreshToken")

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
      

    } catch (error){
      throw new ApiError(500, "User login failed")
      
    }
   })

   // logout business logic
const logoutUser = asyncHandler( async (req, res) =>  {
  try {
    User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {refreshToken: undefinded}
      },
      { new: true }
    )

    const options ={
      httpOnly: true,
      secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", accessToken)
    .clearCookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(200, {}, "user logged out successfully")
    )
      
  } catch (error) {
    throw new ApiError(500, "User logout failed")
    
  }
})
    



export { registerUser, loginUser, logoutUser }