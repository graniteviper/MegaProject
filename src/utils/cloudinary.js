import fs from "fs"
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // Upload the file on Cloudinary: 
        const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type: "auto"
        })
        // File has been uploaded: 
        console.log("File has been uploaded.",response.url);
        fs.unlinkSync(localFilePath);
        return response
    } catch (err) {
        fs.unlinkSync(localFilePath)  //Remove the local saved temporary file as the operation got failed.
        return null;
    }
}

export {uploadOnCloudinary};
