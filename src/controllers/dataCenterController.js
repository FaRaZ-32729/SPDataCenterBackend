const DataCenterModel = require("../models/DataCenterModel");
const userModel = require("../models/userModel");

// create DataCenter
const createDataCenter = async (req, res) => {
    try {
        let { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "DataCenter name is required" });
        }

        name = name.trim().toLowerCase();

        const existingDC = await DataCenterModel.findOne({ name });
        if (existingDC) {
            return res.status(400).json({ message: "DataCenter already exists" });
        }

        const dc = await DataCenterModel.create({ name });

        res.status(201).json({
            message: "DataCenter created successfully",
            datacenter: dc,
        });
    } catch (err) {
        console.error("Error creating DataCenter:", err);
        res.status(500).json({
            message: "Internal Server Error while creating DataCenter",
        });
    }
};

// get DataCenter
const getDataCenter = async (req, res) => {
    try {
        const datacenter = await DataCenterModel.find();

        if (!datacenter) return res.status(404).json({ message: "No DataCenter Found" });

        res.status(200).json(datacenter);
    } catch (error) {
        console.log("error to fetch organizations");
        return res.status(500).json({ message: "Server Error" });
    }
};

// get single DataCenter  
const getDataCenterById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "DataCenter ID is required" });
        }

        const dc = await DataCenterModel.findById(id);

        if (!dc) {
            return res.status(404).json({ message: "DataCenter not found" });
        }

        res.status(200).json({
            message: "DataCenter fetched successfully",
            datacenter: dc,
        });

    } catch (err) {
        console.error("Error fetching DataCenter by ID:", err);
        res.status(500).json({
            message: "Internal Server Error while fetching DataCenter",
        });
    }
};

// get DataCenter by user id
const getDataCenterByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // Check if user exists
        const user = await userModel.findById(userId).populate("organization");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user has an organization
        if (!user.organization) {
            return res.status(404).json({ message: "This user does not belong to any DataCenter" });
        }

        // Return populated organization
        res.status(200).json({
            message: "DataCenter fetched successfully",
            organization: user.organization,
        });

    } catch (err) {
        console.error("Error fetching organization by user ID:", err);
        res.status(500).json({
            message: "Internal Server Error while fetching DataCenter by user ID",
        });
    }
};


// update organizations
const updateDataCenter = async (req, res) => {
    try {
        const { id } = req.params;
        let { name } = req.body;

        if (!id) {
            return res.status(400).json({ message: "DataCenter ID is required" });
        }

        if (!name) {
            return res.status(400).json({ message: "DataCenter name is required" });
        }

        name = name.trim().toLowerCase();

        const existingOrg = await DataCenterModel.findOne({ name });
        if (existingOrg && existingOrg._id.toString() !== id) {
            return res.status(400).json({ message: "Another DataCenter with this name already exists" });
        }

        const dc = await DataCenterModel.findByIdAndUpdate(
            id,
            { name },
            { new: true, runValidators: true }
        );

        if (!dc) {
            return res.status(404).json({ message: "DataCenter not found" });
        }

        res.status(200).json({
            message: "DataCenter updated successfully",
            datacenter: dc,
        });
    } catch (err) {
        console.error("Error updating DataCenter:", err);
        res.status(500).json({
            message: "Internal Server Error while updating DataCenter",
        });
    }
};

// delete organizations by id
const deleteDataCenter = async (req, res) => {
    try {
        const { id } = req.params;

        const dc = await DataCenterModel.findById(id);
        if (!dc) {
            return res.status(404).json({ message: "DataCenter not found" });
        }

        await DataCenterModel.findByIdAndDelete(id);

        res.status(200).json({
            message: "DataCenter deleted successfully",
            deletedDataCenter: dc,
        });

    } catch (err) {
        console.error("Error deleting DataCenter:", err);
        res.status(500).json({
            message: "Internal Server Error while deleting DataCenter",
        });
    }
};



module.exports = { createDataCenter, getDataCenter, updateDataCenter, deleteDataCenter, getDataCenterById, getDataCenterByUserId }