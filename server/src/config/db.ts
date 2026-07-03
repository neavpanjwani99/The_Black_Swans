import mongoose from "mongoose"

//Connect to DataBase
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error("MONGO_URI is not defined in the environment variables");
        }
        const connectInstance = await mongoose.connect(mongoURI);
        console.log(`Mongo DB connected Host : ${connectInstance.connection.host}`)
    } catch (error) {
        console.log("Data Base Connection error : ",error);
        process.exit(1) //or throw to get error
    }
}

export default connectDB;