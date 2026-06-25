import mongoose from "mongoose"

//Connect to DataBase
const connectDB = async () => {
    try {
        const connectInstance = await mongoose.connect(`mongodb+srv://gautamdoliya69_db_user:gautamdoliya69@cluster0.brvha5t.mongodb.net/drsihtiAi`)
        console.log(`Mongo DB connected Host : ${connectInstance.connection.host}`)
    } catch (error) {
        console.log("Data Base Connection error : ",error);
        process.exit(1) //or throw to get error
    }
}

export default connectDB;