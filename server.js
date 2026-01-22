const express = require("express");
const dotenv = require("dotenv");
const dbConnection = require("./src/config/dbConnection");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");

// Routers
const userRouter = require("./src/routes/userRouter");
const dataCenterRouter = require("./src/routes/dataCenterRouter");
const authRouter = require("./src/routes/authRouter");
const alertsRouter = require("./src/routes/alertsRouter");
const hubRouter = require("./src/routes/hubRouter");
const rackRouter = require("./src/routes/rackRouter");
const acKitRouter = require("./src/routes/acKitRouter");
const rackClusterRouter = require("./src/routes/rackClusterRouter");
const acControlRouter = require("./src/routes/acControlRoutes");
const authenticate = require("./src/middlewere/authMiddleware");


// Utilities
const { espAlertSocket } = require("./src/utils/espAlertSocket");
const { espAcStatusSocket } = require("./src/utils/espAcStatusSocket");

dotenv.config();
dbConnection();
const port = process.env.PORT || 5053;
const app = express();
const server = http.createServer(app);

// Middlewares
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));


app.use(express.json());
app.use(cookieParser());
app.use("/assets", express.static(path.join(__dirname, "./assets")));


// Routes
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/data-center", dataCenterRouter);
app.use("/hub", hubRouter);
app.use("/rack", rackRouter);
app.use("/ackit", acKitRouter);
app.use("/rack-cluster", rackClusterRouter);
app.use("/ac", acControlRouter);
app.use("/alert", alertsRouter);

app.get("/", (req, res) => {
    res.send("Hellow FaRaZ To IOTFIY-SindhPolice-DataCenter Server");
});


const alertWss = espAlertSocket(server);
const acWss = espAcStatusSocket(server);

// alerts ws://ip/localhost:5053/ws/alerts
// alerts ws://ip/localhost:5053/ws/ac-control
server.on("upgrade", (req, socket, head) => {
    if (req.url === "/ws/alerts") {
        alertWss.handleUpgrade(req, socket, head, (ws) => {
            alertWss.emit("connection", ws, req);
        });
    }
    else if (req.url === "/ws/ac-control") {
        acWss.handleUpgrade(req, socket, head, (ws) => {
            acWss.emit("connection", ws, req);
        });
    }
    else {
        socket.destroy(); // reject unknown paths
    }
});


// Start server
server.listen(port, () => {
    console.log(`Express & WebSocket is running on port : ${port}`);
});