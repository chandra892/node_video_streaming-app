import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            indexe: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            indexe: true
        },
        avatar: {
            type: String, // cloudinery url 
            required: true,
        },
        coverImage: {
            type: String, // cloudinery url 
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "Password is required"],

        },
        refreshTokens: {
            type: String,
        }

    }, { timestamps: true })

userSchema.pre("save", async function (next) {
    // check if password is not changed
    if (!this.isModified("password")) return next
    // hash password
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
// create custom methods to check password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// create custom methods to genearte access Token
userSchema.methods.generateAcess = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    }, process.env.SECRET_KEY, {
        expiresIn: process.env.SECRET_KEY_EXPIRY
    })
}
// create custom methods to genearte refresh Token expiry
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    }, process.env.REFRESH_SECRET_KEY,
        {
            expiresIn: process.env.REFRESH_SECRET_KEY_EXPIRY
        })
}



export const User = mongoose.model("User", userSchema)