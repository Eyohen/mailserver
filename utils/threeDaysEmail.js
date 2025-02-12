const nodemailer = require("nodemailer");
const dotenv = require("dotenv");


module.exports = async (
  from,
  email,
  subject,
  text,
  firstName,
  type,
  endDate
) => {
  try {
    const transporter = nodemailer.createTransport({
    //   host: "smtp.zoho.com",
    //   port: 587,
    //   secure: false,
      host: "smtp.gmail.com",
      port: 465, // SMTP port for secure connections
      secure: true, // true for 465, false for other ports

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
    <title>Subscription Expiration Notice</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f8f8; border-radius: 5px;">
        <tr>
            <td style="padding: 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px;">
                            <h1 style="color: #e74c3c; margin: 0 0 20px; text-align: center; font-size: 24px;">Subscription Expiration Notice</h1>
                            
                            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${firstName},</p>
                            
                            <p style="font-size: 16px; margin-bottom: 20px;">This is a friendly reminder that your subscription with Pigeonhire is set to expire in <strong style="color: #e74c3c;">3 days</strong>.</p>
                            
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9f9f9; border-radius: 5px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="color: #2c3e50; margin: 0 0 15px; font-size: 18px;">Subscription Details:</h2>
                                        <p style="margin: 5px 0;"><strong style="color: gray">Plan:</strong>${type}</p>
                                        <p style="margin: 5px 0;"><strong style="color: gray">Expiration Date:</strong>${endDate}</p>
                                        <p style="margin: 5px 0; color: green;"><strong style="color: gray">Current Status:</strong> Active</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- <p style="font-size: 16px; margin-bottom: 20px;">To ensure uninterrupted access to our services, please renew your subscription before the expiration date.</p> -->
                            
                            <!-- <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="#" style="display: inline-block; background-color: #3498db; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">Renew Now</a>
                                    </td>
                                </tr>
                            </table> -->
                            
                            <p style="font-size: 16px; margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                            
                            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for your continued support!</p>
                            
                            <p style="font-size: 16px; margin-bottom: 0;">Best regards,<br>Pigeonhire Team</p>
                        </td>
                    </tr>
                </table>
                
                <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
                    This is an automated message. Please do not reply to this email.<br>
                </p>
            </td>
        </tr>
    </table>
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
