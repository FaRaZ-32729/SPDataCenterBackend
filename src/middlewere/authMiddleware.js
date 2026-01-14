const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const authenticate = async (req, res, next) => {
    try {

        // 1) Try cookie first
        let token = req.cookies?.token;

        // 2) Fallback: Authorization header (Bearer token)
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Unauthenticated user" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id);
        if (!user) return res.status(404).json({ message: "User not found" });
        console.log(`authanticated user ${user.name}`)

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = authenticate;