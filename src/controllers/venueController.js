const organizationModel = require("../models/organizationModel");
const userModel = require("../models/userModel");
const venueModel = require("../models/venueModal");
const mongoose = require("mongoose");

// create venue
const createVenue = async (req, res) => {
    try {
        const { name, organization } = req.body;

        if (!name || !organization)
            return res.status(400).json({ message: "Block name and sector are required" });

        const org = await organizationModel.findById(organization);
        if (!org) return res.status(404).json({ message: "sector not found" })

        const existingVenue = await venueModel.findOne({ name, organization });
        if (existingVenue) {
            return res.status(400).json({
                message: "A block with this name already exists in this sector",
            });
        }

        const venue = await venueModel.create({ name, organization });
        res.status(201).json({
            message: "Block created successfully",
            venue,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating block" });
    }
};

// get all venues
const getVenues = async (req, res) => {
    try {
        const venues = await venueModel.find().populate("organization");

        if (!venues) return res.status(404).json({ message: "No Block Found" });

        return res.json(venues);

    } catch (error) {
        return res.status(500).json({ message: "Error fetching Block" });
    }
};

// get single venue by id
const getSingleVenue = async (req, res) => {
    try {
        const { id } = req.params;

        const venue = await venueModel.findById(id).populate("organization", "name");

        if (!venue) return res.status(404).json({ message: "No Block Found" });

        return res.status(200).json({ venue });

    } catch (error) {
        console.log("error while fetching the venue", error.message);
        return res.status(500).json({ message: "Failed to fetch Block" });
    }
}

// get venues by organizationId
const getVenuesByOrganization = async (req, res) => {
    try {
        const { organizationId } = req.params;

        if (!organizationId)
            return res.status(400).json({ message: "Sector ID is required" });

        const venues = await venueModel.find({ organization: organizationId });

        if (!venues.length)
            return res.status(404).json({ message: "No Block found for this sector" });

        res.status(200).json({ venues });
    } catch (error) {
        console.error("Error fetching venues by organization:", error.message);
        res.status(500).json({ message: "Error fetching block" });
    }
};

// get venues by user id
const getUserVenues = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId" });
        }

        // Find user
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // If no venues assigned
        if (!user.venues || user.venues.length === 0) {
            return res.status(200).json({
                message: "No block assigned to this user",
                venues: [],
            });
        }

        // Return user venues (they already contain venueId + venueName)
        res.status(200).json({
            message: "User block fetched successfully",
            venues: user.venues,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
// update venue
const updateVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name)
            return res.status(400).json({ message: "Block name is required" });

        const venue = await venueModel.findById(id);
        if (!venue) return res.status(404).json({ message: "Block not found" });

        const duplicateVenue = await venueModel.findOne({
            name,
            organization: venue.organization,
            _id: { $ne: id },
        });

        if (duplicateVenue) {
            return res.status(400).json({
                message: "A block with this name already exists in this sector",
            });
        }

        venue.name = name;
        const updatedVenue = await venue.save();

        res.json({
            message: "Block updated successfully",
            venue: updatedVenue,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating block" });
    }
};

// for admin only wher admin can update organization beside venue name
const updateVenueAsAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, organizationId } = req.body;

        // Validate name
        if (!name) {
            return res.status(400).json({ message: "Block name is required" });
        }

        // Validate venue ID
        const venue = await venueModel.findById(id).populate("organization", "name");
        if (!venue) {
            return res.status(404).json({ message: "Block not found" });
        }


        let newOrganizationId = venue.organization?._id; // default: existing org

        // If admin wants to update organization
        if (organizationId) {
            if (!mongoose.Types.ObjectId.isValid(organizationId)) {
                return res.status(400).json({ message: "Invalid sectorId" });
            }

            const organizationExists = await organizationModel.findById(organizationId);
            if (!organizationExists) {
                return res.status(404).json({ message: "Sector not found" });
            }

            newOrganizationId = organizationId;
        }

        // Check duplicate venue in the (new or same) organization
        const duplicateVenue = await venueModel.findOne({
            name,
            organization: newOrganizationId,
            _id: { $ne: id },
        });

        if (duplicateVenue) {
            return res.status(400).json({
                message: "A block with this name already exists in this sector",
            });
        }

        // Update fields
        venue.name = name;
        venue.organization = newOrganizationId;

        // const updatedVenue = await venue.save();
        await venue.save();

        const updatedVenue = await venueModel
            .findById(id)
            .populate("organization", "name");


        return res.json({
            message: "Block updated successfully",
            venue: updatedVenue,
        });

    } catch (error) {
        console.error("Error updating venue:", error);
        res.status(500).json({ message: "Error updating block" });
    }
};

// delete venue
const deleteVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await venueModel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Block not found" });

        res.json({ message: "Block deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting block" });
    }
};

module.exports = { createVenue, getVenues, updateVenue, deleteVenue, getSingleVenue, getVenuesByOrganization, getUserVenues, updateVenueAsAdmin };
