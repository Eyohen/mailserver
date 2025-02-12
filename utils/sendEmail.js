const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const currency = require("../models/currency");

module.exports = async (
  from,
  email,
  subject,
  text,
  firstName,
  communityName,
  title,
  currency,
  amount
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      // service: process.env.SERVICE,
      // port: Number(process.env.EMAIL_PORT),
      // secure: false,
      // host: "smtp.gmail.com",
      //port: 465, // SMTP port for secure connections
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // This can help if there are SSL certificate issues
      }
    });

    await transporter.sendMail({
      from: from,
      to: email,
      subject: subject,
      text: text,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Receipt</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="border: 1px solid #ddd; border-radius: 5px; padding: 20px;">
        <h1 style="color: #4a4a4a; text-align: center;">Pigeonhire Receipt</h1>
        
        <div style="margin-bottom: 20px;">
            <h2 style="color: #2c3e50;">Hello, ${firstName}!</h2>
            <p style="font-size: 16px;">Thank you for your purchase. We truly appreciate your business!</p>
        </div>
        
        <div style="background-color: #f9f9f9; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Purchase Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #ddd;">
                    <th style="text-align: left; padding: 8px;">Item</th>
                    <th style="text-align: right; padding: 8px;">Details</th>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;">Community Owner</td>
                    <td style="text-align: right; padding: 8px;">${communityName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;">Collaboration Type</td>
                    <td style="text-align: right; padding: 8px;">${title}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;">Amount</td>
                    <td style="text-align: right; padding: 8px;">${currency}${amount}</td>
                </tr>
            </table>
        </div>
        
        <div style="text-align: right; font-size: 18px; font-weight: bold;">
            <p>Total: ${currency}${amount}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 14px;">
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Thank you again for your purchase!</p>
        </div>
    </div>
</body>
</html>`,
    });
    console.log("email sent successfully");
  } catch (error) {
    console.log("email not sent!");
    console.log(error);
    return error;
  }
};
