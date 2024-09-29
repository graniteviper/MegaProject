import {asyncHandler} from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middleware.js"
import { apiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler(async (req,res)=>{
    // get user details from frontend: 
    // validation---not empty
    // check if user already exists: 
    // check for images, check for avatar
    // if available upload them on cloudinary
    // check if upload is successful
    // create entry in db 
    // remove passowrd and refresh token field from response 
    // check for user creation 
    // return res

    const {username,fullname,email,password} = req.body
    console.log("email:", email)

    if(fullname === ""){
        throw new apiError(400,"fullname can't be empty")
    }
    if(username === ""){
        throw new apiError(400,"username can't be empty")
    }
    if(email === ""){
        throw new apiError(400,"email can't be empty")
    }
    if(password === ""){
        throw new apiError(400,"password can't be empty")
    }

    const existedUser = User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new apiError(409,"Username already exists.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new apiError(400,"Avatar is required.")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new apiError(400),"Avatar file is required."
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new apiError(500,"Something went wrong on the serverr.")
    }

    return res.status(201).json(
        new apiResponse(200,createdUser,"User registered successfully")
    )

})

export {registerUser}

