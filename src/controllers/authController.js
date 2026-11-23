const Users = require('../models/users')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.SignupUser = async (req, res) => {

    try {
        const { name, email, phone, gender, password } = req.body

        if (!name || !email || !phone || !gender || !password) {
            return res.status(400).json({
                message: "name, email, phone, gender, password is required...",
            })
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await Users.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists",
            });
        }

        const hashedpassword = await bcrypt.hash(password, 10)

        const data = {
            name,
            email: normalizedEmail,
            phone,
            gender,
            password: hashedpassword
        }

        const user = await Users.create(data)

        return res.status(201).json({
            message: "User create sucessfully...",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
        })
    } catch (error) {
        return res.status(400).json({
            messgae: error.message
        })
    }
}


exports.LogInUser = async (req, res) => {

    try {

        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "email, password is required...",
            })
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await Users.findOne({ email: normalizedEmail })

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isPasswordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1h",
            }
        );



        return res.status(200).json({
            message: "Login sucess...",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
        })

    } catch (error) {
        return res.status(400).json({
            message: error.message
        })
    }
}

exports.GetCurrentUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await Users.findById(userId);
        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message
        })
    }
}
