const express = require("express");
const { createAckit, getAllAckits, getSingleAckit, updateAckit, deleteAckit } = require("../controllers/acKitController");
const router = express.Router();


router.post("/add", createAckit);
router.get("/all", getAllAckits);
router.get("/single/:id", getSingleAckit);
router.put("/update/:id", updateAckit);
router.delete("/delete/:id", deleteAckit);

module.exports = router;
