require("dotenv").config();
const express = require('express')
const connectDB = require('./config/dbconnection')
const authRoute = require('./routes/authRoute')
const app = express()

const port = process.env.PORT
app.use(express.json())
const runServer = async () => {
    await connectDB()

    app.use('/api/v1', authRoute)

    app.listen(port, () => {
        console.log(`Server running sucessfully... http://localhost:${port}`)
    })
}

runServer();
