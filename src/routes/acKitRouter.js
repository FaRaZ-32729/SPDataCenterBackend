const express = require("express");
const { createAckit, getAllAckits, getSingleAckit, updateAckit, deleteAckit, getAckitsByDataCenter } = require("../controllers/acKitController");
const router = express.Router();


router.post("/add", createAckit);
router.get("/all", getAllAckits);
router.get("/single/:id", getSingleAckit);
router.get("/by-dataCenter/:dataCenterId", getAckitsByDataCenter);
router.put("/update/:id", updateAckit);
router.delete("/delete/:id", deleteAckit);

module.exports = router;
