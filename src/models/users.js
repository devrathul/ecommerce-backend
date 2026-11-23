const mongoose = require('mongoose')

const usersSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }, email: {
        type: String,
        required: true
    }, phone: {
        type: String,
        required: true
    }, gender: {
        type: String,
        required: true
    }, role: {
        type: String,
        enum: ["admin", "user", "guest"],
        default: "user"
    }, password: {
        type: String,
        required: true
    },
})

const Users = mongoose.model("users", usersSchema)

module.exports = Users;