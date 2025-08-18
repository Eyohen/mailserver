// // utils/emailService.js
// const sgMail = require('@sendgrid/mail');

// // Set your SendGrid API key
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// /**
//  * Generate HTML for verification email
//  * @param {Object} user - User object with firstName, etc.
//  * @param {string} verificationToken - Token for email verification
//  * @param {string} frontendUrl - Base URL for the frontend
//  * @returns {string} HTML content for the email
//  */
// const generateVerificationEmailHtml = (user, verificationToken, frontendUrl) => {
//   const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
  
//   return `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="utf-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Verify Your Email</title>
//     </head>
//     <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8f9fc; color: #333333;">
//       <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f9fc; width: 100%; margin: 0 auto;">
//         <tr>
//           <td style="padding: 20px;">
//             <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);">
//               <!-- Header -->
//               <tr>
//                 <td style="padding: 30px 30px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
//                   <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #000000;">PaperSignal</h1>
//                 </td>
//               </tr>
              
//               <!-- Content -->
//               <tr>
//                 <td style="padding: 30px;">
//                   <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #000000;">Verify Your Email Address</h2>
                  
//                   <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
//                     Hi ${user.firstName},
//                   </p>
                  
//                   <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
//                     Thanks for signing up for PaperSignal! Please verify your email address by clicking the button below:
//                   </p>
                  
//                   <p style="margin: 30px 0; text-align: center;">
//                     <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 4px; text-align: center;">Verify Email Address</a>
//                   </p>
                  
//                   <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
//                     If you didn't create an account with PaperSignal, you can safely ignore this email.
//                   </p>
                  
//                   <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
//                     If the button above doesn't work, copy and paste this link into your browser:
//                   </p>
                  
//                   <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.5; word-break: break-all; color: #4a56e2;">
//                     ${verificationUrl}
//                   </p>
//                 </td>
//               </tr>
              
//               <!-- Footer -->
//               <tr>
//                 <td style="padding: 20px 30px; background-color: #f8f9fc; text-align: center; border-radius: 0 0 8px 8px;">
//                   <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
//                     &copy; ${new Date().getFullYear()} PaperSignal. All rights reserved.
//                   </p>
//                   <p style="margin: 0; font-size: 14px; color: #666666;">
//                     If you have any questions, contact us at <a href="mailto:support@papersignal.com" style="color: #4a56e2; text-decoration: none;">support@papersignal.com</a>
//                   </p>
//                 </td>
//               </tr>
//             </table>
//           </td>
//         </tr>
//       </table>
//     </body>
//     </html>
//   `;
// };

// /**
//  * Generate HTML for welcome email
//  * @param {Object} user - User object with firstName, etc.
//  * @param {string} frontendUrl - Base URL for the frontend
//  * @returns {string} HTML content for the email
//  */
// const generateWelcomeEmailHtml = (user, frontendUrl) => {
//   const loginUrl = `${frontendUrl}/login`;
//   const dashboardUrl = `${frontendUrl}/dashboard`;
  
//   return `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="utf-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Welcome to PaperSignal</title>
//     </head>
//     <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8f9fc; color: #333333;">
//       <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f9fc; width: 100%; margin: 0 auto;">
//         <tr>
//           <td style="padding: 20px;">
//             <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);">
//               <!-- Header -->
//               <tr>
//                 <td style="padding: 30px 30px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
//                   <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #000000;">PaperSignal</h1>
//                 </td>
//               </tr>
              
//               <!-- Content -->
//               <tr>
//                 <td style="padding: 30px;">
//                   <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #000000;">Welcome to PaperSignal!</h2>
                  
//                   <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
//                     Hi ${user.firstName},
//                   </p>
                  
//                   <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
//                     Thank you for verifying your email address. Your account has been successfully activated!
//                   </p>
                  
//                   <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
//                     You can now log in to your account and start using all the features that PaperSignal has to offer.
//                   </p>
                  
//                   <p style="margin: 30px 0; text-align: center;">
//                     <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 4px; text-align: center; margin-right: 10px;">Log In</a>
//                     <a href="${dashboardUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #f0f0f0; color: #000000; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 4px; text-align: center;">Dashboard</a>
//                   </p>
                  
//                   <p style="margin: 0 0 10px; font-size: 16px; line-height: 1.5; color: #333333;">
//                     Here's what you can do now:
//                   </p>
                  
//                   <ul style="margin: 0 0 20px; padding-left: 20px; font-size: 16px; line-height: 1.5; color: #333333;">
//                     <li style="margin-bottom: 10px;">Set up your sender profile</li>
//                     <li style="margin-bottom: 10px;">Create your first email campaign</li>
//                     <li style="margin-bottom: 10px;">Import your contact lists</li>
//                     <li>Explore analytics and reporting tools</li>
//                   </ul>
                  
//                   <p style="margin: 20px 0; font-size: 16px; line-height: 1.5; color: #333333;">
//                     If you have any questions or need assistance, our support team is here to help.
//                   </p>
//                 </td>
//               </tr>
              
//               <!-- Footer -->
//               <tr>
//                 <td style="padding: 20px 30px; background-color: #f8f9fc; text-align: center; border-radius: 0 0 8px 8px;">
//                   <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
//                     &copy; ${new Date().getFullYear()} PaperSignal. All rights reserved.
//                   </p>
//                   <p style="margin: 0; font-size: 14px; color: #666666;">
//                     If you have any questions, contact us at <a href="mailto:support@papersignal.com" style="color: #4a56e2; text-decoration: none;">support@papersignal.com</a>
//                   </p>
//                 </td>
//               </tr>
//             </table>
//           </td>
//         </tr>
//       </table>
//     </body>
//     </html>
//   `;
// };

// /**
//  * Send email verification link
//  * @param {Object} user - User object containing email, first name, etc.
//  * @param {string} verificationToken - The token for email verification
//  * @param {string} frontendUrl - The frontend URL for building the verification link
//  */
// const sendVerificationEmail = async (user, verificationToken, frontendUrl) => {
//   try {
//     // Generate HTML content for the email
//     const htmlContent = generateVerificationEmailHtml(user, verificationToken, frontendUrl);

//     // Create email message
//     const msg = {
//       to: user.email,
//       from: {
//         email: process.env.SENDGRID_FROM_EMAIL || 'Info@coinley.io',
//         name: 'Coinley'
//       },
//       subject: 'Verify Your Email Address - PaperSignal',
//       html: htmlContent,
//       // Text version for email clients that don't support HTML
//       text: `Hi ${user.firstName}, Please verify your email address by clicking this link: ${frontendUrl}/verify-email?token=${verificationToken}`
//     };

//     // Send the email
//     await sgMail.send(msg);
//     console.log(`Verification email sent to ${user.email}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending verification email:', error);
//     if (error.response) {
//       console.error(error.response.body);
//     }
//     return false;
//   }
// };

// /**
//  * Send a welcome email after successful verification
//  * @param {Object} user - User object containing email, first name, etc.
//  * @param {string} frontendUrl - Base URL for the frontend
//  */
// const sendWelcomeEmail = async (user, frontendUrl) => {
//   try {
//     // Generate HTML content for the email
//     const htmlContent = generateWelcomeEmailHtml(user, frontendUrl);

//     // Create email message
//     const msg = {
//       to: user.email,
//       from: {
//         email: process.env.SENDGRID_FROM_EMAIL || 'Info@coinley.io',
//         name: 'PaperSignal'
//       },
//       subject: 'Welcome to PaperSignal!',
//       html: htmlContent,
//       // Text version for email clients that don't support HTML
//       text: `Hi ${user.firstName}, Thank you for verifying your email. Your account has been successfully activated! You can now log in to your account at ${frontendUrl}/login`
//     };

//     // Send the email
//     await sgMail.send(msg);
//     console.log(`Welcome email sent to ${user.email}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending welcome email:', error);
//     if (error.response) {
//       console.error(error.response.body);
//     }
//     return false;
//   }
// };

// module.exports = {
//   sendVerificationEmail,
//   sendWelcomeEmail
// };









// utils/emailService.js
const axios = require('axios')
require('dotenv').config();



/**
 * Generate HTML for verification email
 * @param {Object} user - User object with firstName, etc.
 * @param {string} verificationToken - Token for email verification
 * @param {string} frontendUrl - Base URL for the frontend
 * @returns {string} HTML content for the email
 */
const generateVerificationEmailHtml = (user, verificationToken, frontendUrl) => {
  const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8f9fc; color: #333333;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f9fc; width: 100%; margin: 0 auto;">
        <tr>
          <td style="padding: 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);">
              <!-- Header -->
              <tr>
                <td style="padding: 30px 30px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #000000;">PaperSignal</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #000000;">Verify Your Email Address</h2>
                  
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                    Hi ${user.firstName},
                  </p>
                  
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                    Thanks for signing up for PaperSignal! Please verify your email address by clicking the button below:
                  </p>
                  
                  <p style="margin: 30px 0; text-align: center;">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 4px; text-align: center;">Verify Email Address</a>
                  </p>
                  
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                    If you didn't create an account with PaperSignal, you can safely ignore this email.
                  </p>
                  
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                    If the button above doesn't work, copy and paste this link into your browser:
                  </p>
                  
                  <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.5; word-break: break-all; color: #4a56e2;">
                    ${verificationUrl}
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #f8f9fc; text-align: center; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                    &copy; ${new Date().getFullYear()} PaperSignal. All rights reserved.
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #666666;">
                    If you have any questions, contact us at <a href="mailto:support@papersignal.com" style="color: #4a56e2; text-decoration: none;">support@papersignal.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Generate HTML for welcome email
 * @param {Object} user - User object with firstName, etc.
 * @param {string} frontendUrl - Base URL for the frontend
 * @returns {string} HTML content for the email
 */
const generateWelcomeEmailHtml = (user, frontendUrl) => {
  const loginUrl = `${frontendUrl}/login`;
  const dashboardUrl = `${frontendUrl}/dashboard`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to PaperSignal</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8f9fc; color: #333333;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f9fc; width: 100%; margin: 0 auto;">
        <tr>
          <td style="padding: 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);">
              <!-- Header -->
              <tr>
                <td style="padding: 30px 30px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #000000;">PaperSignal</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #000000;">Welcome to PaperSignal!</h2>
                  
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                    Hi ${user.firstName},
                  </p>
                  
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                    Thank you for verifying your email address. Your account has been successfully activated!
                  </p>
                  
                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                    You can now log in to your account and start using all the features that PaperSignal has to offer.
                  </p>
                  
                  <p style="margin: 30px 0; text-align: center;">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 4px; text-align: center; margin-right: 10px;">Log In</a>
                    <a href="${dashboardUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #f0f0f0; color: #000000; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 4px; text-align: center;">Dashboard</a>
                  </p>
                  
                  <p style="margin: 0 0 10px; font-size: 16px; line-height: 1.5; color: #333333;">
                    Here's what you can do now:
                  </p>
                  
                  <ul style="margin: 0 0 20px; padding-left: 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                    <li style="margin-bottom: 10px;">Set up your sender profile</li>
                    <li style="margin-bottom: 10px;">Create your first email campaign</li>
                    <li style="margin-bottom: 10px;">Import your contact lists</li>
                    <li>Explore analytics and reporting tools</li>
                  </ul>
                  
                  <p style="margin: 20px 0; font-size: 16px; line-height: 1.5; color: #333333;">
                    If you have any questions or need assistance, our support team is here to help.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #f8f9fc; text-align: center; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                    &copy; ${new Date().getFullYear()} PaperSignal. All rights reserved.
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #666666;">
                    If you have any questions, contact us at <a href="mailto:support@papersignal.com" style="color: #4a56e2; text-decoration: none;">support@papersignal.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Send email verification link
 * @param {Object} user - User object containing email, first name, etc.
 * @param {string} verificationToken - The token for email verification
 * @param {string} frontendUrl - The frontend URL for building the verification link
 */
const sendVerificationEmail = async (user, verificationToken, frontendUrl) => {
  try {
    // Generate HTML content for the email
    const htmlContent = generateVerificationEmailHtml(user, verificationToken, frontendUrl);


    // // Create email message
    // const msg = {
    //   to: user.email,
    //   from: {
    //     email: process.env.SENDGRID_FROM_EMAIL || 'Info@coinley.io',
    //     name: 'Coinley'
    //   },
    //   subject: 'Verify Your Email Address - PaperSignal',
    //   html: htmlContent,
    //   // Text version for email clients that don't support HTML
    //   text: `Hi ${user.firstName}, Please verify your email address by clicking this link: ${frontendUrl}/verify-email?token=${verificationToken}`
    // };

    // // Send the email
    // await sgMail.send(msg);
    // console.log(`Verification email sent to ${user.email}`);
    // return true;


     // Create Axios instance with specific configuration
     const instance = axios.create({
      // Do not use https agent for http connection
      httpAgent: require('http').Agent(),
      maxRedirects: 0,        // Don't follow redirects
      timeout: 15000,         // 15 second timeout
      decompress: true        // Allow response compression
  });

  // Make request with the properly configured instance
  const response = await instance({
      method: 'post',
      //url: process.env.EMAIL_API_URL || 'https://mailserver-production-e4d4.up.railway.app/api/send-email', // Keep your port 3001
      url: process.env.EMAIL_API_URL || 'http://localhost:3001/api/send-email',
     
      headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.API_KEY || 'simisolababy' // Fallback to hardcoded value if env not set
      },
      data: {
          from: "support@papersignal.com <info@papersignal.com>",
          to: user.email,
          subject: "Verify Your Email Address - PaperSignal",
          text: `Hi ${user.firstName}, Please verify your email address by clicking this link: ${frontendUrl}/verify-email?token=${verificationToken}`,
          html: htmlContent
      }
  });
  
  console.log("Email sent successfully");
  return response.data;
  } catch (error) {
    console.log('Error sending verification email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    return false;
  }
};

/**
 * Send a welcome email after successful verification
 * @param {Object} user - User object containing email, first name, etc.
 * @param {string} frontendUrl - Base URL for the frontend
 */
const sendWelcomeEmail = async (user, frontendUrl) => {
  try {
    // Generate HTML content for the email
    const htmlContent = generateWelcomeEmailHtml(user, frontendUrl);

    // Create email message
    const msg = {
      to: user.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'Info@coinley.io',
        name: 'PaperSignal'
      },
      subject: 'Welcome to PaperSignal!',
      html: htmlContent,
      // Text version for email clients that don't support HTML
      text: `Hi ${user.firstName}, Thank you for verifying your email. Your account has been successfully activated! You can now log in to your account at ${frontendUrl}/login`
    };

    // Send the email
    await sgMail.send(msg);
    console.log(`Welcome email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail
};