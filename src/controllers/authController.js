const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const DataCenterModel = require("../models/DataCenterModel");
const dotenv = require("dotenv");
const { validatePassword } = require("../utils/passwordValidator");
const validateTimerInSeconds = require("../utils/timeValidator");

dotenv.config();

// api for registering admin
const registerAdmin = async (req, res) => {
    try {
        const { name, email, password, timer } = req.body;
        if (!name || !email || !password || !timer) return res.status(400).json({ message: "All Fields Are Required" });

        const { validT, tMessage } = validateTimerInSeconds(timer);

        if (!validT) {
            return res.status(400).json({ tMessage });
        }

        // Use reusable password validator
        const { valid, message } = validatePassword(password);
        if (!valid) {
            return res.status(400).json({ message });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User Already Exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await userModel.create({
            name,
            email,
            timer,
            password: hashedPassword,
            role: "admin",
            isActive: true,
            isVerified: true,
            createdBy: "admin",
        });

        return res.status(201).json({ message: "Admin Created Successfully", Admin: newAdmin })
    } catch (error) {
        console.log(error.message, "error occured while creating admin");
    }
}

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// api to create user
const createUser = async (req, res) => {
    try {
        const { name, email, dataCenters } = req.body;
        const creator = req.user; // logged-in user

        // ---------------- VALIDATE REQUIRED FIELDS ----------------
        if (!name || !email) {
            return res.status(400).json({ message: "Name and email are required" });
        }

        // ---------------- ROLE HIERARCHY VALIDATION ----------------
        let newUserRole;

        if (creator.role === "admin") {
            newUserRole = "manager";
        } else if (creator.role === "manager") {
            newUserRole = "user";
        } else {
            return res.status(403).json({
                message: "Access Denied: Users cannot create other users",
            });
        }

        // ---------------- DATA CENTER VALIDATION ----------------
        let assignedDataCenters = [];

        if (newUserRole === "manager" || newUserRole === "user") {
            if (!dataCenters || !Array.isArray(dataCenters) || dataCenters.length === 0) {
                return res.status(400).json({
                    message: "At least one data center must be assigned",
                });
            }

            let dataCenterIdsToValidate;

            if (creator.role === "admin") {
                // Admin → client sends real _id from DataCenter collection
                dataCenterIdsToValidate = dataCenters;
            } else if (creator.role === "manager") {
                // Manager → client sends IDs from manager.dataCenters array
                // Map them to the actual dataCenterId stored in manager's dataCenters
                const managerDataCenterMap = {};
                creator.dataCenters.forEach(dc => {
                    managerDataCenterMap[dc._id.toString()] = dc.dataCenterId.toString();
                });

                // Convert provided IDs to real dataCenterId
                dataCenterIdsToValidate = dataCenters.map(dcId => {
                    const realId = managerDataCenterMap[dcId];
                    if (!realId) {
                        // throw new Error(`DataCenter ID ${dcId} not available for this manager`);
                        return res.status(404).json({ message: `DataCenter ID ${dcId} not available for this manager` });

                    }
                    return realId;
                });
            }

            // ---------------- FETCH & VALIDATE DATA CENTERS ----------------
            const validDataCenters = await DataCenterModel.find({
                _id: { $in: dataCenterIdsToValidate },
            });

            if (validDataCenters.length !== dataCenterIdsToValidate.length) {
                return res.status(400).json({
                    message: "One or more data centers are invalid",
                });
            }

            assignedDataCenters = validDataCenters.map(dc => ({
                dataCenterId: dc._id,
                name: dc.name,
            }));
        }


        // ---------------- CHECK DUPLICATE EMAIL ----------------
        const existingEmail = await userModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                message: "User with this email already exists",
            });
        }

        // ---------------- SETUP PASSWORD TOKEN ----------------
        const token = jwt.sign({ email }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        // ---------------- CREATE USER ----------------
        // const newUser = await userModel.create({
        //     name,
        //     email,
        //     role: newUserRole,
        //     createdBy: creator.role,
        //     creatorId: creator._id,
        //     setupToken: token,
        //     isActive: false,
        //     isVerified: false,
        //     dataCenters: assignedDataCenters,
        // });
        // ---------------- CREATE USER ----------------
        const newUserData = {
            name,
            email,
            role: newUserRole,
            createdBy: creator.role,
            creatorId: creator._id,
            setupToken: token,
            isActive: false,
            isVerified: false,
            dataCenters: assignedDataCenters,
        };

        // TIMER LOGIC
        if (creator.role === "admin" && newUserRole === "manager") {
            // Admin must provide timer for manager
            if (!req.body.timer) {
                return res.status(400).json({ message: "Timer is required for manager" });
            }

            const { validT, tMessage } = validateTimerInSeconds(req.body.timer);

            if (!validT) {
                return res.status(400).json({ tMessage });
            }

            newUserData.timer = req.body.timer;
        } else if (creator.role === "manager" && newUserRole === "user") {
            // Users inherit manager's timer
            newUserData.timer = creator.timer;
        }

        const newUser = await userModel.create(newUserData);


        // ---------------- SEND SETUP EMAIL ----------------
        const setupLink = `${process.env.FRONTEND_URL}/setup-password/${token}`;

        await sendEmail(
            newUser.email,
            "Set up your Data Center account",
            `
            <div style="font-family: Arial, sans-serif; color: #333; background: #f5f8fa; padding: 20px; border-radius: 8px;">
                <div style="text-align: center;">
                    <img src="https://polekit.iotfiysolutions.com/assets/logo.png" alt="DataCenter Logo" style="width: 120px; margin-bottom: 20px;" />
                </div>
                <h2 style="color: #0055a5;">Welcome to Data Center!</h2>
                <p>Hello <b>${newUser.name || newUser.email}</b>,</p>
                <p>Your account has been created. Please click below to set your password:</p>

                <div style="text-align: center; margin: 20px 0;">
                    <a href="${setupLink}"
                       style="background-color: #0055a5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-size: 16px;">
                       Set Password
                    </a>
                </div>

                <p style="font-size: 14px; color: #555;">
                    This link will expire in 24 hours. If you didn't expect this email, ignore it.
                </p>
                <hr/>
                <p style="font-size: 12px; text-align: center; color: #888;">
                    © ${new Date().getFullYear()} IOTFIY Solutions. All rights reserved.
                </p>
            </div>
            `
        );

        // ---------------- RESPONSE ----------------
        return res.status(201).json({
            message: "User created and setup link sent",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                dataCenters: newUser.dataCenters,
                isActive: newUser.isActive,
                isVerified: newUser.isVerified,
            },
        });

    } catch (err) {
        console.error("Create User Error:", err);
        return res.status(500).json({ message: "Error creating user" });
    }
};


const setPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password)
            return res.status(400).json({ message: "Password is required" });

        // const passwordRegex =
        //     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // if (!passwordRegex.test(password)) {
        //     return res.status(400).json({
        //         message:
        //             "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.",
        //     });
        // };

        const { valid, message } = validatePassword(password);
        if (!valid) {
            return res.status(400).json({ message });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findOne({ email: decoded.email, setupToken: token });
        if (!user)
            return res.status(404).json({ message: "Invalid or expired link" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min validity

        user.password = hashedPassword;
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();


        const setupLink = `${process.env.FRONTEND_URL}/verify-otp/${token}`;

        await sendEmail(
            user.email,
            "Verify Your Data Center account",
            `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #e6e6e6; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e6e6e6;">
          <img src="https://polekit.iotfiysolutions.com/assets/logo.png" alt="DataCenter Logo" style="max-width: 150px;" />
      </div>

      <h2 style="color: #263238; margin-top: 30px;">Welcome to Data Center!</h2>
      <p style="font-size: 14px; line-height: 1.6;">
          Hi <strong>${user.name || user.email}</strong>,
          <br><br>
          Your password has been successfully set. To complete your account setup, please use the one-time password (OTP) below to verify your email address.
      </p>

      <div style="background-color: #f4faff; border: 1px solid #cde7ff; padding: 15px; margin: 20px 0; text-align: center; font-size: 22px; letter-spacing: 3px; font-weight: bold;">
          ${otp}
      </div>

      <div style="text-align: center; margin: 25px 0;">
            <a href="${setupLink}"
                style="background-color: #0055a5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-size: 16px;">
                Verify OTP
            </a>
      </div>

      <p style="font-size: 14px; line-height: 1.6;">
          This OTP is valid for the next <strong>10 minutes</strong>. If you didn’t request this, please ignore this email.
      </p>

      <p style="font-size: 14px; line-height: 1.6;">
          Best Regards, <br>
          <strong>LuckyOne Team</strong>
      </p>

      <div style="text-align: center; font-size: 12px; color: #777; margin-top: 30px;">
          © ${new Date().getFullYear()} IOTFIY Solutions, All rights reserved.
          <br>
          This is an automated message, please do not reply.
      </div>
  </div>
  `
        );


        return res.json({ message: "Password set successfully, OTP sent to email" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error setting password" });
    }
};

// verify otp
const verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const { token } = req.params;

        if (!otp || !token)
            return res.status(400).json({ message: "OTP and token are required" });

        // Decode token to get email
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findOne({ email: decoded.email });

        if (!user) return res.status(404).json({ message: "User not found" });

        // Validate OTP
        if (user.otp !== otp)
            return res.status(400).json({ message: "Invalid OTP" });

        if (Date.now() > user.otpExpiry)
            return res.status(400).json({ message: "OTP expired" });

        // Update user status
        user.isVerified = true;
        user.isActive = true;
        user.otp = null;
        user.otpExpiry = null;
        user.setupToken = null;

        await user.save();

        return res.json({
            message: "Account verified successfully. You can now log in.",
        });
    } catch (err) {
        console.error("OTP Verification Error:", err);
        if (err.name === "TokenExpiredError") {
            return res.status(400).json({ message: "Verification link expired" });
        }
        return res.status(500).json({ message: "Error verifying OTP" });
    }
};

// login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // const user = await userModel.findOne({ email });
        // let userQuery = userModel.findOne({ email });

        // Populate only if organization field exists
        // userQuery = userQuery.populate({
        //     path: "organization",
        //     select: "name",
        // });

        // const user = await userQuery;
        const user = await userModel.findOne({ email });

        if (!user)
            return res.status(404).json({ message: "User not found" });

        if (!user.isActive)
            return res.status(403).json({
                message: user.suspensionReason || "Account suspended by Admin",
            });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const { password: _, ...userData } = user.toObject();

        return res.status(200).json({
            message: "Login successful",
            user: userData,
            token,
        });
    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ message: "Login error" });
    }
};

//forget password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email)
            return res.status(400).json({ message: "Email is required" });

        const user = await userModel.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found" });

        // Generate reset token (expires in 15 minutes)
        const resetToken = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        // Create reset link
        // const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Send email
        await sendEmail(
            user.email,
            "Reset Your Data Center Account Password",
            `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>Hello <b>${user.name || user.email}</b>,</p>
                <p>We received a request to reset your password. Click the link below to set a new password. 
                This link will expire in <b>15 minutes</b>.</p>

                <div style="margin: 20px 0;">
                    <a href="${resetLink}" 
                       style="background-color: #0055a5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                       Reset Password
                    </a>
                </div>

                <p>If you didn’t request this, please ignore this email.</p>
                <hr/>
                <p style="font-size: 12px; color: #777;">© ${new Date().getFullYear()} IOTFIY Solutions. All rights reserved.</p>
            </div>
            `
        );

        // Optionally store token (to invalidate later if needed)
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
        await user.save();

        return res.status(200).json({
            message: "Password reset link sent to your email",
        });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        return res.status(500).json({ message: "Error sending reset email" });
    }
};

// reset password
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password)
            return res.status(400).json({ message: "Token and new password are required" });

        // Validate new password
        // const passwordRegex =
        //     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // if (!passwordRegex.test(password)) {
        //     return res.status(400).json({
        //         message:
        //             "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.",
        //     });
        // }

        const { valid, message } = validatePassword(password);
        if (!valid) {
            return res.status(400).json({ message });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findOne({
            email: decoded.email,
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() } // ensure token not expired
        });

        if (!user)
            return res.status(400).json({ message: "Invalid or expired reset link" });

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;

        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Reset Password Error:", err);
        if (err.name === "TokenExpiredError")
            return res.status(400).json({ message: "Reset link expired" });

        return res.status(500).json({ message: "Error resetting password" });
    }
};

// logout user 
const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token", { httpOnly: true, sameSite: "none", path: "/", secure: true });
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logout:", error);
        return res.status(500).json({ success: false, message: "Logout failed" });
    }
};

// verified user after login
const verifyMe = async (req, res) => {
    console.log("verify");
    try {
        return res.status(200).json({
            success: true,
            user: req.user,
        });
    } catch (error) {
        console.error("Error While Verifing User", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


module.exports = { createUser, setPassword, verifyOTP, loginUser, registerAdmin, verifyMe, resetPassword, forgotPassword, logoutUser }