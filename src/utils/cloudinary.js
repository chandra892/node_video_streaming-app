import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully 
        console.log("file uploaded on cloudinary successfully", result.url);
        return result;

    } catch (error) {
        // unlink the file
        fs.unlinkSync(localFilePath); // remove the loaclly saved file as the upload operation got failed 
        console.error("Error uploading file on cloudinary", error);
        return null;

    }

}

export default {uploadOnCloudinary};