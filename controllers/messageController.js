const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    let targetReceiverId = receiverId;
    if (!targetReceiverId) {
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        targetReceiverId = adminUser._id;
      } else {
        const staffUser = await User.findOne({ role: 'staff' });
        if (staffUser) {
          targetReceiverId = staffUser._id;
        }
      }
    }

    if (!targetReceiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu người nhận hoặc nội dung tin nhắn',
      });
    }

    const message = await Message.create({
      senderId,
      receiverId: targetReceiverId,
      content,
      isRead: false,
    });

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get message history between two users
// @route   GET /api/messages/:otherUserId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = req.params.otherUserId;

    // Mark incoming messages as read
    await Message.updateMany(
      { senderId: otherId, receiverId: myId, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get active conversations list (For staff/admin to see who chatted)
// @route   GET /api/messages/conversations/list
// @access  Private (Staff / Admin only)
exports.getConversationsList = async (req, res) => {
  try {
    const myId = req.user._id;

    // Aggregate unique message exchanges
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: myId }, { receiverId: myId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', myId] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$content' },
          lastMessageTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', myId] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Populate user info for each conversation ID
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const user = await User.findById(conv._id).select('name email phone role');
        return {
          user,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      conversations: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get the support recipient (first admin)
// @route   GET /api/messages/support/recipient
// @access  Private
exports.getSupportRecipient = async (req, res) => {
  try {
    const adminUser = await User.findOne({ role: 'admin' }).select('name email');
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản hỗ trợ',
      });
    }
    res.status(200).json({
      success: true,
      recipient: adminUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
