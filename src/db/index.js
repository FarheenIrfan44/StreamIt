import mongoose, { modelNames } from "mongoose";


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`);
        console.log(`\n MongoDb connected. DB Host: ${connectionInstance.connection.host}`);
        
        
    } catch (error) {
        console.log("MongoDb coneection error ", error);
        process.exit(1)
        

        
    }
}

export default connectDB