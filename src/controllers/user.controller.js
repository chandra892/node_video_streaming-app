
import { asyncHandler } from "../utils/asyncHandler.js"

const registerUser  = asyncHandler(async (req, res) => {
  console.log("Register user function called");
  res.status(200).json({
    message: "User  registered successfully."
  })
})

export { registerUser  }