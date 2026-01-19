const adminOrManagerOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not Authenticated' });
    }

    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "manager";

    if (!isAdmin && !isManager) {
        return res.status(403).json({ message: "Admin or Manager privileges required" });
    }

    next();
};

module.exports = adminOrManagerOnly;
