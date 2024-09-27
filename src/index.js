// To connect with the database: 
// require('dotenv').config({path:'./env'})  Disrupts consistency
import dotenv from "dotenv";
// Importing connection DB;
import connectDB from "./db/index.js";

// connecting DB through function(Second Approach):
connectDB()
.then(
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Listening on Port:${process.env.PORT}`);
        
    })
)
.catch((err)=>{
    console.log("Error in Connecting:",err);
})













// First Approach: 
/*
import express from "express";
const app = express();

;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        // To catch errors even after we are able to connect with the database but not able to read data
        app.on("error",(err)=>{
            console.log("Not able to connect with the database: ",err);
            throw err;
        })
        // Listening on port:
        app.listen(process.env.PORT,()=>{
            console.log("Listening on port: ",process.env.PORT);
        })
    } catch (error) {
        console.log("Error:"+error);
        throw error;
    }
})()
    */