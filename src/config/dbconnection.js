const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("DB connection sucessfully...")
    } catch (err) {
        console.log(error)
    }
}

module.exports = connectDB