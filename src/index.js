require("dotenv").config();
const express = require('express')
const connectDB = require('./config/dbconnection')
const app = express()

const port = process.env.PORT

const runServer = async () => {
    await connectDB()
    app.listen(port, () => {
        console.log(`Server running sucessfully... http://localhost:${port}`)
    })
}

runServer();
