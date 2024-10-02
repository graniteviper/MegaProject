import {asyncHandler} from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        // user.accessToken = accessToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (err) {
        throw new apiError(500,"Something went wrong while generating tokens.")
    }
}

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

    const existedUser =  await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new apiError(409,"Username already exists.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
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

const loginUser = asyncHandler(async (req,res)=>{
    const {email,username,password} = req.body
    if(!username && !email){
        throw new apiError(400,"Username or Password is Required.")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new apiError(404,"User does not exist.")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new apiError(404,"Invalid user credentials..")
    }

    const {accessToken,refreshToken} = await generateTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true,
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new apiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully."
        )
    )
})

const logoutUser = asyncHandler(async (req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },{
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true,
    }    
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new apiResponse(200,{},"User logged out."))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new apiError(401,"User unauthorized.")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new apiError(401,"Inavlid Refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new apiError(401,"Refresh Token is expired or invalid.")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,refreshToken} = await generateTokens(user._id)
    
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
        .json(
            new apiResponse(
                200,
                {
                    accessToken,
                    newRefreshToken: refreshToken,
                },
                "Access Token refreshed successfully."
            )
        )
    } catch (error) {
        throw new apiError(401,error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword  = asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword} = req.body
    const user = User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new apiError(401,"Invalid Password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200)
    .json(200,{},"Password Changed Successfully!!")
})

const getcurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.user,"Current user fetched Scucessfully.")
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {fullname} = req.body
    if(!fullname){
        throw new apiError(400,"Required field is not filled.")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,{
            $set:{
                fullname
            }
        },{
            new:true
        }
    ).select("-password")

    return res.status(200)
    .json(new apiResponse(200,user,"Account updated Successfully."))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new apiError(400,"Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new apiError(400,"Error while uploading the new avatar.")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(
        new apiResponse(200,user,"Avatar changed successfully!!")
    )
})

const updateuserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new apiError(400,"cover Image is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new apiError(400,"Error while uploading the new avatar.")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(
        new apiResponse(200,user,"cover image changed successfully!!")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params
    if(!username?.trim()){
        throw new apiError(400,"Username is missng.")
    }
    const channel = await User.aggregate([
        {
            $match:{
                username,
            }
        },{
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },{
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers",
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false,
                    }
                }
            }
        },{
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
            }
        }
    ])

    if(!channel?.length){
        throw new apiError(404,"Channel does not exist.")
    }

    return res.status(200)
    .json(
        new apiResponse(200,channel[0],"User channel fetched successfully.")
    )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owners",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1,

                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(
        new apiResponse(
            200,
            user[0].watchHistory,
            "Watch History Fetched Successfully!!"
        )
    )
})



export {registerUser,loginUser,logoutUser,refreshAccessToken,updateAccountDetails,changeCurrentPassword,getcurrentUser,updateUserAvatar,updateuserCoverImage,getWatchHistory,getUserChannelProfile}

