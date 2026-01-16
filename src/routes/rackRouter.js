const express = require("express");
const {
    createRack,
    getAllRacks,
    getSingleRack,
    updateRack,
    deleteRack,
} = require("../controllers/rackController");

const router = express.Router();

router.post("/add", createRack);
router.get("/all", getAllRacks);
router.get("/single/:id", getSingleRack);
router.put("/update/:id", updateRack);
router.delete("/delete/:id", deleteRack);

module.exports = router;
