import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String, // cloudinery url
            required: true
        },
        thumbnail: {
            type: String, // cloudinery url
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number, // in seconds
            required: true,
            min: 1,

        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        dislikes: {
            type: Number,
            default: 0
        },
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Comment'
            }
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true })

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = new mongoose.model("Video", videoSchema)