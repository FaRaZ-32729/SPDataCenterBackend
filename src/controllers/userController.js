const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const DataCenterModel = require("../models/DataCenterModel");
const mongoose = require("mongoose");
const venueModel = require("../models/venueModal");


//get all users for admin
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find();
        if (!users) return res.status(404).json({ message: "No Users Found" });
        return res.status(200).json(users);
    } catch (error) {
        console.log("error while getting all users");
        return res.status(500).json({ message: "Server Error" })
    }
};

// get user by user id
const getUsersByCreatorId = async (req, res) => {
    try {
        const { creatorId } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(creatorId)) {
            return res.status(400).json({ message: "Invalid creatorId" });
        }

        // Find users created by this creator
        const users = await userModel
            .find({ creatorId })
            .populate("dataCenters.dataCenterId", "name")
            .populate("creatorId", "name email")
            .lean();

        if (!users || users.length === 0) {
            return res.status(200).json({
                message: "No users found for this creator",
                users: [],
            });
        }

        return res.status(200).json({
            message: "Users fetched successfully",
            users,
        });

    } catch (error) {
        console.error("Error fetching users by creator:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// only admin can activate or deactivate the manager's status
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, suspensionReason } = req.body;

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (isActive === false && !suspensionReason) {
            return res.status(400).json({
                message: "Suspension reason required when deactivating user",
            });
        }

        // ---------------- UPDATE USER STATUS ----------------
        user.isActive = isActive;
        user.suspensionReason = isActive ? "" : suspensionReason;
        await user.save();

        // ---------------- CASCADE: MANAGER → USERS ----------------
        if (user.role === "manager" && isActive === false) {
            await userModel.updateMany(
                { creatorId: user._id },
                {
                    $set: {
                        isActive: false,
                        suspensionReason: "Your account has been temporarily deactivated because your manager’s account has been suspended by the administrator. Please contact your manager.",
                    },
                }
            );
        }

        // ---------------- SEND EMAIL (UNCHANGED) ----------------
        try {
            const statusText = isActive ? "Activated" : "Deactivated";
            const messageBody = isActive
                ? `
                    <p>Hello <b>${user.name || user.email}</b>,</p>
                    <p>We’re pleased to inform you that your account has been <b>re-activated</b> and is now accessible again.</p>
                    <p>If you did not request this or believe it is a mistake, please <a href="mailto:support@iotfiysolution.com">contact support</a>.</p>
                `
                : `
                    <p>Hello <b>${user.name || user.email}</b>,</p>
                    <p>Your account has been <b>deactivated</b> by the admin.</p>
                    <p><b>Reason:</b> ${suspensionReason}</p>
                    <p>If you believe this action was taken in error, please <a href="mailto:support@iotfiysolution.com">contact support</a> as soon as possible.</p>
                `;

            await sendEmail(
                user.email,
                `Account ${statusText} - Data Center`,
                `
                <div style="font-family: Arial, sans-serif; color: #333; background: #f5f8fa; padding: 20px; border-radius: 8px;">
                    <div style="text-align: center;">
                        <img src="https://polekit.iotfiysolutions.com/assets/logo.png" alt="dataCenter Logo" style="width: 120px; margin-bottom: 20px;" />
                    </div>
                    <h2 style="color: #0055a5;">Account ${statusText}</h2>
                    ${messageBody}
                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #888; text-align: center;">
                        &copy; ${new Date().getFullYear()} IOTFIY Solutions. All rights reserved.<br/>
                        <a href="mailto:support@iotfiysolution.com" style="color: #0055a5; text-decoration: none;">Contact Support</a>
                    </p>
                </div>
                `
            );
        } catch (emailError) {
            console.error("Error sending email:", emailError);
        }

        return res.status(200).json({
            message: `User has been ${isActive ? "activated" : "deactivated"}`,
            user,
        });

    } catch (err) {
        console.error("Error updating user status:", err);
        return res.status(500).json({ message: "Error updating user status" });
    }
};

// only update name , email and password
// const updateUserProfile = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { name, email, password } = req.body;

//         const user = await userModel.findById(id);
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         // Update name if provided
//         if (name) user.name = name;

//         // Update email if provided and not already in use
//         if (email && email !== user.email) {
//             const emailExists = await userModel.findOne({ email });
//             if (emailExists) {
//                 return res.status(400).json({ message: "Email already in use" });
//             }
//             user.email = email;
//         }

//         // Update password if provided
//         if (password) {
//             // const salt = await bcrypt.genSalt(10);
//             user.password = await bcrypt.hash(password, 10);
//         }

//         // Save the user
//         await user.save();

//         res.status(200).json({
//             message: "User updated successfully",
//             user,
//         });
//     } catch (err) {
//         console.error("Error updating user:", err);
//         res.status(500).json({ message: "Error updating user" });
//     }
// };

const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, dataCenters } = req.body;

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        //  Update name if provided
        if (name) user.name = name;

        //  Update email if provided and not already in use
        if (email && email !== user.email) {
            const emailExists = await userModel.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;
        }

        //  Update password if provided
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        //  Update dataCenters if provided
        if (dataCenters && Array.isArray(dataCenters)) {
            const validatedDataCenters = [];

            for (const dc of dataCenters) {
                // Each dc should contain only dataCenterId
                if (!dc.dataCenterId) {
                    return res.status(400).json({
                        message: "Each dataCenter must have dataCenterId",
                    });
                }

                // Check if the DataCenter exists
                const existingDC = await DataCenterModel.findById(dc.dataCenterId);
                if (!existingDC) {
                    return res.status(404).json({
                        message: `DataCenter with ID ${dc.dataCenterId} not found`,
                    });
                }

                // Push with the name fetched from DB
                validatedDataCenters.push({
                    dataCenterId: existingDC._id,
                    name: existingDC.name,
                });
            }

            // Replace user's dataCenters with validated array
            user.dataCenters = validatedDataCenters;
        }


        // Save user
        await user.save();

        res.status(200).json({
            message: "User updated successfully",
            user,
        });
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ message: "Error updating user" });
    }
};

//delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await userModel.findByIdAndDelete(id);

        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: "Error deleting user" });
    }
};


// add new data center to user's dataCenters array
const addDataCenterToUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { dataCenterId } = req.body;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(dataCenterId)) {
            return res.status(400).json({ message: "Invalid userId" });
        }


        if (!mongoose.Types.ObjectId.isValid(dataCenterId)) {
            return res.status(400).json({ message: "Invalid dataCenterId" });
        }

        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if data center exists
        const dataCenter = await DataCenterModel.findById(dataCenterId);
        if (!dataCenter) {
            return res.status(404).json({ message: "Data center not found" });
        }

        // Prevent duplicate assignment
        // const alreadyAssigned = user.dataCenters.some(
        //     (dc) => dc.dataCenterId.toString() === dataCenterId
        // );

        // if (alreadyAssigned) {
        //     return res.status(409).json({
        //         message: "Data center already assigned to this user",
        //     });
        // }

        // Add data center
        user.dataCenters.push({
            dataCenterId: dataCenter._id,
            name: dataCenter.name,
        });

        await user.save();

        const populatedUser = await userModel
            .findById(userId)
            .populate("dataCenters.dataCenterId", "name")
            .lean();

        return res.status(200).json({
            message: "Data center added to user successfully",
            user: populatedUser,
        });

    } catch (error) {
        console.error("Add Data Center Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// remove a data center from user's dataCenters array
const removeDataCenterFromUser = async (req, res) => {
    try {
        const { userId, dcId } = req.params;


        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId" });
        }
        if (!mongoose.Types.ObjectId.isValid(dcId)) {
            return res.status(400).json({ message: "Invalid dataCenterId" });
        }

        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if data center is assigned
        const dataCenterExists = user.dataCenters.some(
            (dc) => dc.dataCenterId.toString() === dcId
        );

        if (!dataCenterExists) {
            return res.status(404).json({
                message: "Data center not assigned to this user",
            });
        }

        // Remove data center
        const updatedUser = await userModel
            .findByIdAndUpdate(
                userId,
                { $pull: { dataCenters: { dataCenterId: dcId } } }, // ✅ FIXED
                { new: true }
            )
            .populate("dataCenters.dataCenterId", "name")
            .lean();

        return res.status(200).json({
            message: "Data center removed from user successfully",
            user: updatedUser,
        });

    } catch (error) {
        console.error("Remove Data Center Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// get users by data center id
const getUsersByDataCenterId = async (req, res) => {
    try {
        const { dcId } = req.params;

        if (!dcId) {
            return res.status(400).json({ message: "Data Center ID is required" });
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(dcId)) {
            return res.status(400).json({ message: "Invalid Data Center ID" });
        }

        // Find users assigned to this data center
        const users = await userModel
            .find({
                "dataCenters.dataCenterId": dcId,
            })
            .select(
                "-password -otp -otpExpiry -resetToken -resetTokenExpiry -setupToken -suspensionReason"
            )
            .populate("dataCenters.dataCenterId", "name")
            .lean();

        if (!users || users.length === 0) {
            return res.status(404).json({
                message: "No users found for this data center",
                users: [],
            });
        }

        return res.status(200).json({
            message: "Users fetched successfully for this data center",
            users,
        });

    } catch (err) {
        console.error("Error fetching users by data center ID:", err);
        return res.status(500).json({
            message: "Internal Server Error while fetching users by data center ID",
        });
    }
};

// get users status
const getUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await userModel.findById(userId).select("isActive");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            isActive: user.isActive
        });

    } catch (error) {
        console.error("Error fetching user status:", error);
        res.status(500).json({ message: "Server error" });
    }
};


module.exports = { getAllUsers, updateUserStatus, updateUserProfile, deleteUser, getUsersByDataCenterId, addDataCenterToUser, removeDataCenterFromUser, getUserStatus, getUsersByCreatorId }