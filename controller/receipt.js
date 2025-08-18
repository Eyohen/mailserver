const db = require("../models");
const { Receipt } = db;
const { Op } = require('sequelize');
const sendReceipt = require('../utils/sendReceipt.js')


const create = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      appliances,
      totalWattage,
      totalAppliances
    } = req.body;

    // Validate required fields
    if (!firstName || !email || !phone) {
      return res.status(400).json({ 
        msg: "Please provide all required fields (firstName, email, phone)" 
      });
    }

    // Create Receipt record
    const record = await Receipt.create({
      firstName,
      email,
      phone,
      appliances,
      totalWattage,
      totalAppliances,
      status: 'pending',
    });

    // TODO: Add email notification logic here
    // sendEstimationNotification(email, firstName);
    await sendInitial(
      "henry.eyo2@gmail.com",
      email,
      "Your Solar System Estimation",
      firstName,
      phone,
      appliances,
      totalWattage,
      totalAppliances,
    );

    return res.status(200).json({ 
      record, 
      msg: "Calculation request submitted successfully" 
    });
  } catch (error) {
    console.error("Receipt creation error:", error);
    return res.status(500).json({ 
      msg: "Failed to create calculation request", 
      error: error.message 
    });
  }
};

const readAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const records = await Receipt.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      records: records.rows,
      total: records.count,
      currentPage: page,
      totalPages: Math.ceil(records.count / limit)
    });
  } catch (error) {
    return res.status(500).json({ 
      msg: "Failed to fetch records", 
      error: error.message 
    });
  }
};

const readById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Receipt.findByPk(id);
    
    if (!record) {
      return res.status(404).json({ msg: "Record not found" });
    }

    return res.json(record);
  } catch (error) {
    return res.status(500).json({ 
      msg: "Failed to fetch record", 
      error: error.message 
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      estimationNotes
    } = req.body;

    const record = await Receipt.findByPk(id);
    
    if (!record) {
      return res.status(404).json({ msg: "Record not found" });
    }

    // Update only allowed fields
    await record.update({
      status: status || record.status,
      estimationNotes: estimationNotes || record.estimationNotes
    });

    // TODO: Add notification logic for status updates
    // if (status === 'completed') {
    //   sendEstimationCompletedNotification(record.email, record.firstName);
    // }

    return res.json({ 
      record, 
      msg: "Record updated successfully" 
    });
  } catch (error) {
    return res.status(500).json({ 
      msg: "Failed to update record", 
      error: error.message 
    });
  }
};

const deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Receipt.findByPk(id);

    if (!record) {
      return res.status(404).json({ msg: "Record not found" });
    }

    await record.destroy();
    return res.json({ 
      msg: "Record deleted successfully" 
    });
  } catch (error) {
    return res.status(500).json({ 
      msg: "Failed to delete record", 
      error: error.message 
    });
  }
};

const getByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const records = await Receipt.findAll({
      where: { status },
      order: [['createdAt', 'DESC']]
    });

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ 
      msg: "Failed to fetch records", 
      error: error.message 
    });
  }
};

module.exports = {
  create,
  readAll,
  readById,
  update,
  deleteById,
  getByStatus
};