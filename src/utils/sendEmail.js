const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,      
    port: process.env.SMTP_PORT,      
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,  
        pass: process.env.SMTP_PASS  
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"SmartVolt" <support@odor.iotfiysolutions.com>`,
            to,
            subject,
            html,
        });

        console.log("Email sent ✔");
    } catch (err) {
        console.error("Email error:", err);
    }
};

module.exports = sendEmail;
