import mongoose from "mongoose";
import {DB_NAME} from '../constants.js'; // Importing DB Name
// Defining the function to connect with DB: 

const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB Connected!! DB Host: ${connectionInstance.connection.host}`);
        
    } catch (err) {
        console.log("Error: ",err);
        process.exit(1);
    }
}

export default connectDB;
