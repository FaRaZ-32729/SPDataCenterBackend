const express = require("express");
const { getAllUsers, updateUserStatus, updateUserProfile, deleteUser, getUsersByDataCenterId, removeDataCenterFromUser, addDataCenterToUser, getUserStatus, getUsersByCreatorId } = require("../controllers/userController");
const adminOnly = require("../middlewere/adminOnly");
const authenticate = require("../middlewere/authMiddleware");
const adminOrAdminCreatedUser = require("../middlewere/adminOrAdminCreatedUser");

const router = express.Router();

router.post("/:userId/add-datacenter", authenticate, adminOrAdminCreatedUser, addDataCenterToUser);
router.put("/update-status/:id", authenticate, adminOnly, updateUserStatus);
router.get("/all", authenticate, getAllUsers);
router.get("/status/:userId", getUserStatus);
router.get("/:creatorId", getUsersByCreatorId);
router.get("/by-datacenter/:dcId", authenticate,  getUsersByDataCenterId)
router.put("/update/:id", authenticate, adminOnly, updateUserProfile);
router.delete("/delete/:id", authenticate, adminOrAdminCreatedUser, deleteUser);
router.delete("/:userId/delete/:dcId", authenticate,  removeDataCenterFromUser);


module.exports = router;