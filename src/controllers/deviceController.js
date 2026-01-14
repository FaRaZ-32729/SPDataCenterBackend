const deviceModel = require("../models/deviceModel");
const organizationModel = require("../models/organizationModel");
const venueModel = require("../models/venueModal");

const createDevice = async (req, res) => {
    try {
        const { orgId, venueId, deviceId, latitude, longitude } = req.body;

        // Validate required fields
        if (!orgId || !venueId || !deviceId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                message: "orgId, blockId, deviceId, latitude, and longitude are required",
            });
        }

        // Check duplicate deviceId
        const duplicateDevice = await deviceModel.findOne({ deviceId });
        if (duplicateDevice) return res.status(400).json({ message: "Device ID already exists. So should be unique" })

        // Check venue existence
        const venue = await venueModel.findById(venueId);
        if (!venue) {
            return res.status(404).json({ message: "Block not found" });
        }

        // Check organization existence
        const organization = await organizationModel.findById(orgId);
        if (!organization) {
            return res.status(404).json({ message: "Sector not found" });
        }

        // Validate deviceId (string and not empty)
        if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
            return res.status(400).json({ message: "Device ID is invalid" });
        }

        // Check duplicate deviceId in same venue
        // const existingDevice = await deviceModel.findOne({ deviceId, venue: venueId });
        // if (existingDevice) {
        //     return res.status(400).json({
        //         message: `Device ID "${deviceId}" already exists in this venue`,
        //     });
        // }

        // Validate latitude & longitude (must be valid numbers)
        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ message: "Latitude and longitude must be valid numbers" });
        }

        // Validate latitude range
        if (latitude < -90 || latitude > 90) {
            return res.status(400).json({
                message: "Latitude must be between -90 and 90",
            });
        }

        // Validate longitude range
        if (longitude < -180 || longitude > 180) {
            return res.status(400).json({
                message: "Longitude must be between -180 and 180",
            });
        }

        // Save device
        const newDevice = await deviceModel.create({
            orgId,
            venue: venueId,
            deviceId,
            latitude,
            longitude,
        });

        return res.status(201).json({
            message: "Device created successfully",
            device: newDevice,
        });

    } catch (error) {
        console.error("Error creating device:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};



// get all devices
const getAllDevices = async (req, res) => {
    try {
        const devices = await deviceModel.find()
            .populate("venue", "name organization");

        if (!devices) return res.status(404).json({ message: "No Devices" });

        res.status(200).json(devices);
    } catch (err) {
        console.error("Error fetching devices:", err);
        res.status(500).json({ message: "Failed to fetch devices" });
    }
};

// get single device by deviceId
const getSingleDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await deviceModel.findById(id).populate("venue", "name");
        if (!device) return res.status(404).json({ message: "No Device Found" });
        res.status(200).json({ device });
    } catch (error) {
        console.log("error while fetching device", error.message);
        res.status(500).json({ message: "Failed to fetch device" });
    }
}

// get devices by venueId
const getDevicesByVenue = async (req, res) => {
    try {
        const { venueId } = req.params;

        if (!venueId) {
            return res.status(400).json({ message: "Block ID is required" });
        }

        const devices = await deviceModel.find({ venue: venueId }).populate("venue", "name");

        if (!devices.length) {
            return res.status(404).json({ message: "No devices found for this Block" });
        }

        res.status(200).json({ devices });
    } catch (error) {
        console.error("Error fetching devices by venue:", error.message);
        res.status(500).json({ message: "Failed to fetch devices" });
    }
};

// update devices 
// NOTE :  if user updates deviceId and Conditons than new apiKey will generate otherwise apiKey remains same
const updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const { orgId, venueId, deviceId, latitude, longitude } = req.body;


        // Fetch existing device
        const device = await deviceModel.findById(id);
        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }

        if (deviceId && deviceId !== device.deviceId) {
            const duplicateDevice = await deviceModel.findOne({
                deviceId,
                _id: { $ne: id } // ignore the current device
            });

            if (duplicateDevice) {
                return res.status(400).json({ message: "Device ID already exists. So it should be unique" });
            }
        }

        // Validate orgId (if updated)
        if (orgId) {
            const organization = await organizationModel.findById(orgId);
            if (!organization) {
                return res.status(404).json({ message: "Sector not found" });
            }
        }

        // Validate venueId (if updated)
        if (venueId) {
            const venue = await venueModel.findById(venueId);
            if (!venue) {
                return res.status(404).json({ message: "Block not found" });
            }
        }

        // Validate deviceId (if updated)
        // if (deviceId) {
        if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
            return res.status(400).json({ message: "Device ID is invalid" });
        }
        // Validate latitude/longitude if provided
        if (latitude !== undefined) {
            if (isNaN(latitude)) {
                return res.status(400).json({ message: "Latitude must be a valid number" });
            }
            if (latitude < -90 || latitude > 90) {
                return res.status(400).json({
                    message: "Latitude must be between -90 and 90",
                });
            }
        }

        if (longitude !== undefined) {
            if (isNaN(longitude)) {
                return res.status(400).json({ message: "Longitude must be a valid number" });
            }
            if (longitude < -180 || longitude > 180) {
                return res.status(400).json({
                    message: "Longitude must be between -180 and 180",
                });
            }
        }

        // Update fields only if provided
        if (orgId) device.orgId = orgId;
        if (venueId) device.venue = venueId;
        if (deviceId) device.deviceId = deviceId;
        if (latitude !== undefined) device.latitude = latitude;
        if (longitude !== undefined) device.longitude = longitude;

        await device.save();

        return res.status(200).json({
            message: "Device updated successfully",
            device,
        });

    } catch (error) {
        console.error("Error updating device:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


// delete device by id
const deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await deviceModel.findByIdAndDelete(id);

        if (!deleted) return res.status(404).json({ message: "Device not found" });

        res.status(200).json({ message: "Device deleted successfully" });
    } catch (err) {
        console.error("Error deleting device:", err);
        res.status(500).json({ message: "Failed to delete device" });
    }
};



module.exports = { createDevice, getDevicesByVenue, getAllDevices, deleteDevice, updateDevice, getSingleDevice };