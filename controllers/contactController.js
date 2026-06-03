const Contact = require('../models/Contact');

// @desc    Submit a contact form
// @route   POST /api/contacts
// @access  Public
exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, content, orderCode } = req.body;

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      content,
      orderCode: orderCode ? orderCode.toUpperCase() : undefined,
      status: 'new',
    });

    res.status(201).json({
      success: true,
      message: 'Gửi liên hệ thành công! Chúng tôi sẽ phản hồi lại bạn sớm nhất có thể.',
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private (Staff / Admin)
exports.getContacts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const contacts = await Contact.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reply and update contact status
// @route   PUT /api/contacts/:id
// @access  Private (Staff / Admin)
exports.replyContact = async (req, res) => {
  try {
    const { staffReply, status } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy liên hệ này',
      });
    }

    if (staffReply !== undefined) contact.staffReply = staffReply;
    if (status) contact.status = status;

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật và trả lời liên hệ thành công!',
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update contact status
// @route   PUT /api/contacts/:id/status
// @access  Private (Staff / Admin)
exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy liên hệ này',
      });
    }

    if (status) contact.status = status;

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái liên hệ thành công!',
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
