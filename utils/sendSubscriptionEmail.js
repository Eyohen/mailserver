const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const currency = require("../models/currency");

module.exports = async (
  from,
  email,
  subject,
  text,
  firstName,
  type,
  amount,
  currency,
  createdAt,
  endDate
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: 587,
      secure: false,
      // host: "smtp.gmail.com",
      // port: 465, // SMTP port for secure connections
      // secure: true, // true for 465, false for other ports

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
    <title>Subscription Receipt</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="border: 1px solid #ddd; border-radius: 5px; padding: 20px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin-bottom: 5px;">Pigeonhire</h1>
            <p style="color: #7f8c8d; font-size: 14px;">Your Trusted Community Partner</p>
        </div>
        
        <div style="background-color: #ffffff; border-radius: 5px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-bottom: 10px;">Subscription Receipt</h2>
            <p style="font-size: 16px;">Hello, <strong>${firstName}</strong>!</p>
            <p style="font-size: 16px;">Thank you for subscribing to our service. We truly appreciate your trust in TechCorp Solutions!</p>
        </div>
        
        <div style="background-color: #ffffff; border-radius: 5px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Subscription Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #ddd;">
                    <th style="text-align: left; padding: 8px;">Plan</th>
                    <th style="text-align: left; padding: 8px;">Duration</th>
                    <th style="text-align: right; padding: 8px;">Amount</th>
                </tr>
                <tr>
                    <td style="padding: 8px;">Premium Package</td>
                    <td style="padding: 8px;">${type}</td>
                    <td style="text-align: right; padding: 8px;">₦${amount} ${currency}</td>
                </tr>
            </table>
        </div>
        
        <div style="text-align: right; font-size: 18px; font-weight: bold; margin-bottom: 20px;">
            <p>Total: ₦${amount} ${currency}</p>
        </div>
        
        <div style="background-color: #ffffff; border-radius: 5px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Subscription Period:</h3>
            <p>Your <strong>${type === 'annually' ? "annual" : type}</strong> subscription is valid from the date of purchase.</p>
            <p>Start Date: <strong>${new Date(createdAt).toDateString()}</strong></p>
            <p>End Date: <strong>${new Date(endDate).toDateString()}</strong></p>
    
        </div>
        
        <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
            <p>If you have any questions about your subscription, please don't hesitate to contact our support team.</p>
            <p>Thank you again for choosing Pigeonhire!</p>
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
