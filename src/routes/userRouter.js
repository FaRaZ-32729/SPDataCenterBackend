const express = require("express");
const { getAllUsers, updateUserStatus, updateUserProfile, deleteUser, getUsersByDataCenterId, removeDataCenterFromUser, addDataCenterToUser, getUserStatus, getUsersByCreatorId, updateAdminTimer } = require("../controllers/userController");
const adminOnly = require("../middlewere/adminOnly");
const authenticate = require("../middlewere/authMiddleware");
const adminOrManagerOnly = require("../middlewere/adminOrManagerOnly");

const router = express.Router();

router.post("/:userId/add-datacenter", authenticate, adminOrManagerOnly, addDataCenterToUser);
router.put("/update-status/:id", authenticate, adminOnly, updateUserStatus);
router.put("/update-time/:id", authenticate, adminOnly, updateAdminTimer);
router.get("/all", authenticate, getAllUsers);
router.get("/status/:userId", getUserStatus);
router.get("/:creatorId", getUsersByCreatorId);
router.get("/by-datacenter/:dcId", authenticate, getUsersByDataCenterId)
router.put("/update/:id", authenticate, adminOnly, updateUserProfile);
router.delete("/delete/:id", authenticate, adminOrManagerOnly, deleteUser);
router.delete("/:userId/delete/:dcId", authenticate, removeDataCenterFromUser);


module.exports = router;