const db = require('../models');
const { EmailTransaction, Merchant } = db;
const { Op } = require('sequelize');


const sendEmail = async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      subject,
      content,
      htmlContent,
      emailType,
      templateType,
      metadata,
    } = req.body;
    const merchantId = req.merchant.id;

    if (!recipientEmail || !subject || !content) {
      return res.status(400).json({
        msg: 'Recipient email, subject, and content are required',
      });
    }

    const senderEmail = process.env.RESEND_FROM_EMAIL;

    const senderName = req.merchant.businessName || `${req.merchant.firstName} ${req.merchant.lastName}`;

    const emailTransaction = await EmailTransaction.create({
      merchantId,
      recipientEmail,
      recipientName,
      senderEmail,
      senderName,
      subject,
      templateType,
      emailType: emailType || 'transactional',
      content,
      htmlContent,
      status: 'pending',
      metadata: metadata || {},
    });

    try {
      // ACTUAL EMAIL SENDING
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: `${senderName} <${senderEmail}>`,
          to: [recipientEmail],
          subject: subject,
          text: content,
          html: htmlContent || content
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );


      await emailTransaction.update({
        status: 'sent',
        sentAt: new Date(),
        externalId: response.data.id
      });

      return res.status(200).json({
        success: true,
        emailTransaction,
        msg: 'Email sent successfully',
      });
    } catch (emailError) {
      console.error('Resend API error:', emailError.response?.data || emailError.message);
      
      await emailTransaction.update({
        status: 'failed',
        errorMessage: emailError.response?.data?.message || emailError.message,
      });

      return res.status(500).json({
        success: false,
        msg: 'Failed to send email',
        error: emailError.response?.data?.message || emailError.message,
      });
    }
  } catch (error) {
    console.log('Error sending email:', error);
    return res.status(500).json({ msg: 'Failed to send email', error });
  }
};

const getEmailTransactions = async (req, res) => {
  try {
    const merchantId = req.merchant.id;
    const {
      status,
      emailType,
      page = 1,
      limit = 20,
      startDate,
      endDate,
      search,
    } = req.query;

    const whereClause = { merchantId };

    if (status) {
      whereClause.status = status;
    }

    if (emailType) {
      whereClause.emailType = emailType;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { recipientEmail: { [Op.iLike]: `%${search}%` } },
        { recipientName: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: emailTransactions } = await EmailTransaction.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    return res.status(200).json({
      success: true,
      emailTransactions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.log('Error fetching email transactions:', error);
    return res.status(500).json({ msg: 'Failed to fetch email transactions', error });
  }
};

const getEmailTransactionById = async (req, res) => {
  try {
    const { emailId } = req.params;
    const merchantId = req.merchant.id;

    const emailTransaction = await EmailTransaction.findOne({
      where: { id: emailId, merchantId },
    });

    if (!emailTransaction) {
      return res.status(404).json({ msg: 'Email transaction not found' });
    }

    return res.status(200).json({
      success: true,
      emailTransaction,
    });
  } catch (error) {
    console.log('Error fetching email transaction:', error);
    return res.status(500).json({ msg: 'Failed to fetch email transaction', error });
  }
};

const updateEmailStatus = async (req, res) => {
  try {
    const { emailId } = req.params;
    const { status, openedAt, clickedAt } = req.body;
    const merchantId = req.merchant.id;

    const emailTransaction = await EmailTransaction.findOne({
      where: { id: emailId, merchantId },
    });

    if (!emailTransaction) {
      return res.status(404).json({ msg: 'Email transaction not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (openedAt) updateData.openedAt = openedAt;
    if (clickedAt) updateData.clickedAt = clickedAt;

    await emailTransaction.update(updateData);

    return res.status(200).json({
      success: true,
      emailTransaction,
      msg: 'Email status updated successfully',
    });
  } catch (error) {
    console.log('Error updating email status:', error);
    return res.status(500).json({ msg: 'Failed to update email status', error });
  }
};

const getEmailStats = async (req, res) => {
  try {
    const merchantId = req.merchant.id;
    const { startDate, endDate } = req.query;

    const whereClause = { merchantId };

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const totalSent = await EmailTransaction.count({
      where: { ...whereClause, status: 'sent' },
    });

    const totalFailed = await EmailTransaction.count({
      where: { ...whereClause, status: 'failed' },
    });

    const totalOpened = await EmailTransaction.count({
      where: { ...whereClause, status: 'opened' },
    });

    const totalClicked = await EmailTransaction.count({
      where: { ...whereClause, status: 'clicked' },
    });

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : 0;
    const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalSent,
        totalFailed,
        totalOpened,
        totalClicked,
        openRate: `${openRate}%`,
        clickRate: `${clickRate}%`,
      },
    });
  } catch (error) {
    console.log('Error fetching email stats:', error);
    return res.status(500).json({ msg: 'Failed to fetch email stats', error });
  }
};

const resendEmail = async (req, res) => {
  try {
    const { emailId } = req.params;
    const merchantId = req.merchant.id;

    const emailTransaction = await EmailTransaction.findOne({
      where: { id: emailId, merchantId },
    });

    if (!emailTransaction) {
      return res.status(404).json({ msg: 'Email transaction not found' });
    }

    if (emailTransaction.status !== 'failed') {
      return res.status(400).json({ msg: 'Only failed emails can be resent' });
    }

    try {
      // TODO: Integrate actual email service here

      await emailTransaction.update({
        status: 'sent',
        sentAt: new Date(),
        errorMessage: null,
      });

      return res.status(200).json({
        success: true,
        emailTransaction,
        msg: 'Email resent successfully',
      });
    } catch (emailError) {
      await emailTransaction.update({
        errorMessage: emailError.message,
      });

      return res.status(500).json({
        success: false,
        msg: 'Failed to resend email',
        error: emailError.message,
      });
    }
  } catch (error) {
    console.log('Error resending email:', error);
    return res.status(500).json({ msg: 'Failed to resend email', error });
  }
};

module.exports = {
  sendEmail,
  getEmailTransactions,
  getEmailTransactionById,
  updateEmailStatus,
  getEmailStats,
  resendEmail,
};