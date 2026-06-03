// Staff Dashboard Script
document.addEventListener('DOMContentLoaded', async () => {
  const staffContainer = document.getElementById('staff-dashboard-container');
  if (!staffContainer) return;

  // Security check: Redirect guest and normal customer users
  try {
    const data = await fetchAPI('/api/auth/me', { silent: true });
    if (!data.success || (data.user.role !== 'staff' && data.user.role !== 'admin')) {
      window.location.href = '/login.html';
      return;
    }
    updateDashboardUserCard(data.user);
  } catch (err) {
    window.location.href = '/login.html';
    return;
  }

  function updateDashboardUserCard(user) {
    const avatarEl = document.querySelector('.dashboard-user-avatar');
    const nameEl = document.querySelector('.dashboard-user-name');
    const roleEl = document.querySelector('.dashboard-user-role');

    if (nameEl) nameEl.textContent = user.name || 'Nhân viên';
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Admin' : (user.role === 'staff' ? 'Staff' : 'Customer');

    if (avatarEl) {
      if (user.avatar) {
        avatarEl.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      } else {
        let fallbackEmoji = '👤';
        if (user.role === 'admin') fallbackEmoji = '👑';
        else if (user.role === 'staff') fallbackEmoji = '👩‍🍳';
        avatarEl.textContent = fallbackEmoji;
      }
    }
  }

  const tabMenuItems = document.querySelectorAll('.dashboard-menu-item');
  const tabPanels = document.querySelectorAll('.dashboard-tab-panel');

  const switchTab = (tabId) => {
    tabMenuItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.tab === tabId) item.classList.add('active');
    });

    tabPanels.forEach(panel => {
      panel.classList.remove('active');
      if (panel.id === tabId) panel.classList.add('active');
    });

    // Run loaders
    if (tabId === 'tab-stats') loadStaffStats();
    if (tabId === 'tab-orders') loadStaffOrders();
    if (tabId === 'tab-custom') loadCustomCakes();
    if (tabId === 'tab-messages') loadMessagesWorkspace();
    if (tabId === 'tab-manual') loadManualOrderForm();
  };

  tabMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.dataset.tab);
    });
  });

  // ================= TAB: STATISTICS SUMMARY =================
  const loadStaffStats = async () => {
    try {
      const data = await fetchAPI('/api/dashboard/staff');
      if (data.success) {
        document.getElementById('stat-pending-orders').textContent = data.stats.pendingOrders;
        document.getElementById('stat-preparing-orders').textContent = data.stats.preparingOrders;
        document.getElementById('stat-shipping-orders').textContent = data.stats.shippingOrders;
        document.getElementById('stat-completed-today').textContent = data.stats.completedToday;
        document.getElementById('stat-custom-cakes').textContent = data.stats.pendingCustomCakes;
        document.getElementById('stat-new-contacts').textContent = data.stats.newContacts;
        document.getElementById('stat-low-stock').textContent = data.stats.lowStockAlerts;

        // Render low stock list
        const lowStockTableBody = document.getElementById('low-stock-table-body');
        if (lowStockTableBody) {
          if (data.lowStockProducts.length === 0) {
            lowStockTableBody.innerHTML = '<tr><td colspan="4" class="text-center">🎉 Không có sản phẩm nào sắp hết hàng!</td></tr>';
          } else {
            lowStockTableBody.innerHTML = data.lowStockProducts.map(p => `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td>${p.code}</td>
                <td><span style="color: var(--danger); font-weight: 700;">${p.stock}</span></td>
                <td><span class="status-indicator"><span class="status-dot blocked"></span>Yêu cầu nhập hàng</span></td>
              </tr>
            `).join('');
          }
        }
      }
    } catch (e) {}
  };

  // ================= TAB: ORDERS MANAGEMENT =================
  let currentOrderStatusFilter = '';

  window.setOrderStatusFilter = (status) => {
    currentOrderStatusFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadStaffOrders();
  };

  const loadStaffOrders = async () => {
    const tableBody = document.getElementById('staff-orders-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Đang tải danh sách đơn hàng...</td></tr>';

    let url = '/api/orders?';
    if (currentOrderStatusFilter) url += `status=${currentOrderStatusFilter}&`;
    
    const searchVal = document.getElementById('order-search-input')?.value;
    if (searchVal) url += `search=${encodeURIComponent(searchVal)}&`;

    try {
      const data = await fetchAPI(url);
      if (data.success) {
        renderStaffOrders(data.orders);
      }
    } catch (e) {
      tableBody.innerHTML = '<tr><td colspan="8" class="text-center" style="color: var(--danger);">Lỗi tải dữ liệu.</td></tr>';
    }
  };

  const renderStaffOrders = (orders) => {
    const tableBody = document.getElementById('staff-orders-table-body');
    if (orders.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Không tìm thấy đơn hàng nào.</td></tr>';
      return;
    }

    tableBody.innerHTML = orders.map(order => {
      const itemsList = order.items.map(item => `
        <div style="font-size: 13px;">${item.name} (${item.size} | ${item.flavor}) x <strong>${item.quantity}</strong></div>
      `).join('');

      const dateStr = new Date(order.deliveryDate).toLocaleDateString('vi-VN');

      return `
        <tr>
          <td><strong>#${order.orderCode}</strong></td>
          <td>
            <div style="font-weight: 700;">${order.fullname}</div>
            <div style="font-size: 12px; color: var(--gray-600);">${order.phone}</div>
          </td>
          <td>${itemsList}</td>
          <td><strong style="color: var(--primary-hover);">${order.finalAmount.toLocaleString('vi-VN')}đ</strong></td>
          <td>
            <div style="font-size: 13px;">${dateStr}</div>
            <div style="font-size: 11px; color: var(--gray-600);">${order.deliveryTime}</div>
          </td>
          <td>
            <select class="form-control" style="padding: 6px; font-size: 12px; width: 130px;" onchange="updateOrderState('${order._id}', this.value)">
              <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Chờ xác nhận</option>
              <option value="confirmed" ${order.orderStatus === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
              <option value="preparing" ${order.orderStatus === 'preparing' ? 'selected' : ''}>Đang chuẩn bị</option>
              <option value="shipping" ${order.orderStatus === 'shipping' ? 'selected' : ''}>Đang giao bánh</option>
              <option value="completed" ${order.orderStatus === 'completed' ? 'selected' : ''}>Hoàn thành</option>
              <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
              <option value="refunded" ${order.orderStatus === 'refunded' ? 'selected' : ''}>Đã hoàn tiền</option>
            </select>
          </td>
          <td>
            <select class="form-control" style="padding: 6px; font-size: 12px; width: 110px;" onchange="updateOrderPayment('${order._id}', this.value)">
              <option value="unpaid" ${order.paymentStatus === 'unpaid' ? 'selected' : ''}>Chưa trả tiền</option>
              <option value="pending_confirm" ${order.paymentStatus === 'pending_confirm' ? 'selected' : ''}>Chờ duyệt CK</option>
              <option value="paid" ${order.paymentStatus === 'paid' ? 'selected' : ''}>Đã thanh toán</option>
              <option value="failed" ${order.paymentStatus === 'failed' ? 'selected' : ''}>Thất bại</option>
              <option value="refunded" ${order.paymentStatus === 'refunded' ? 'selected' : ''}>Đã hoàn tiền</option>
            </select>
          </td>
          <td>
            <button class="table-btn primary" onclick="viewOrderDetails('${order._id}')">Chi tiết</button>
          </td>
        </tr>
      `;
    }).join('');
  };

  window.updateOrderState = async (orderId, orderStatus) => {
    try {
      const data = await fetchAPI(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ orderStatus }),
      });
      if (data.success) {
        showToast(data.message, 'success');
        loadStaffOrders();
      }
    } catch (e) {}
  };

  window.updateOrderPayment = async (orderId, paymentStatus) => {
    try {
      const data = await fetchAPI(`/api/orders/${orderId}/payment`, {
        method: 'PUT',
        body: JSON.stringify({ paymentStatus }),
      });
      if (data.success) {
        showToast(data.message, 'success');
        loadStaffOrders();
      }
    } catch (e) {}
  };

  // View order detail card modal popup
  window.viewOrderDetails = async (orderId) => {
    try {
      const data = await fetchAPI(`/api/orders/${orderId}`);
      if (data.success && data.order) {
        const order = data.order;
        
        let modal = document.getElementById('order-detail-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'order-detail-modal';
          modal.className = 'admin-modal';
          document.body.appendChild(modal);
        }

        modal.innerHTML = `
          <div class="modal-content-card">
            <div class="modal-header-row">
              <h3>Chi Tiết Đơn Hàng #${order.orderCode}</h3>
              <button class="modal-close-btn" onclick="closeOrderModal()">&times;</button>
            </div>
            <div style="font-size: 14px;">
              <p><strong>Khách hàng:</strong> ${order.fullname}</p>
              <p><strong>SĐT:</strong> ${order.phone} | <strong>Email:</strong> ${order.email}</p>
              <p><strong>Địa chỉ nhận:</strong> ${order.address}</p>
              <p><strong>Thời gian nhận bánh:</strong> ${new Date(order.deliveryDate).toLocaleDateString('vi-VN')} vào khoảng ${order.deliveryTime}</p>
              <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod.toUpperCase()}</p>
              <p><strong>Ghi chú từ khách:</strong> ${order.note || 'Không có'}</p>
              
              <h4 style="margin-top: 20px; border-bottom: 1px solid var(--gray-200); padding-bottom: 8px;">Danh sách sản phẩm bánh</h4>
              <div style="margin: 12px 0;">
                ${order.items.map(item => `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <div>
                      <strong>${item.name}</strong> (${item.size} | ${item.flavor})
                      ${item.note ? `<div style="font-size: 11px; color: var(--gray-600); margin-left: 10px;">✍️ Chữ trên bánh: "${item.note}"</div>` : ''}
                    </div>
                    <span>${item.price.toLocaleString('vi-VN')}đ x ${item.quantity}</span>
                  </div>
                `).join('')}
              </div>
              <div style="text-align: right; font-weight: 700; font-size: 16px; margin-top: 16px;">
                Tổng tiền gốc: ${order.totalAmount.toLocaleString('vi-VN')}đ<br>
                Khuyến mãi giảm giá: -${order.discountAmount.toLocaleString('vi-VN')}đ<br>
                <span style="color: var(--primary-hover); font-size: 18px;">Thực thu: ${order.finalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        `;
        modal.style.display = 'flex';
      }
    } catch (e) {}
  };

  window.closeOrderModal = () => {
    const modal = document.getElementById('order-detail-modal');
    if (modal) modal.style.display = 'none';
  };

  // Bind order search input
  const oSearch = document.getElementById('order-search-input');
  if (oSearch) {
    oSearch.addEventListener('input', () => {
      loadStaffOrders();
    });
  }

  // ================= TAB: CUSTOM CAKE REQUESTS =================
  const loadCustomCakes = async () => {
    const customList = document.getElementById('custom-cakes-list');
    if (!customList) return;

    customList.innerHTML = '<div class="text-center">Đang tải các yêu cầu đặt bánh riêng...</div>';

    try {
      const data = await fetchAPI('/api/custom-cakes');
      if (data.success) {
        renderCustomCakes(data.requests);
      }
    } catch (e) {
      customList.innerHTML = '<div class="text-center" style="color: var(--danger);">Không thể tải danh sách.</div>';
    }
  };

  const renderCustomCakes = (requests) => {
    const customList = document.getElementById('custom-cakes-list');
    if (requests.length === 0) {
      customList.innerHTML = '<div class="text-center" style="padding: 32px; color: var(--gray-600);">Không có yêu cầu đặt bánh theo yêu cầu nào.</div>';
      return;
    }

    customList.innerHTML = requests.map(req => {
      const date = new Date(req.expectedDate).toLocaleDateString('vi-VN');
      
      let actionAreaHTML = '';
      if (req.status === 'pending' || req.status === 'received' || req.status === 'consulting') {
        actionAreaHTML = `
          <div style="margin-top: 16px; border-top: 1px solid var(--gray-200); padding-top: 12px; display: flex; gap: 8px; align-items: flex-end;">
            <div class="form-group" style="margin-bottom: 0; flex-grow: 1;">
              <label style="font-size: 12px;">Đề xuất báo giá (VNĐ):</label>
              <input type="number" id="quote-price-${req._id}" class="form-control" style="padding: 8px 12px; font-size: 13px;" placeholder="Ví dụ: 350000" value="${req.quotedPrice || ''}">
            </div>
            <button class="btn btn-primary" style="padding: 10px 16px; font-size: 13px;" onclick="sendCustomQuote('${req._id}')">Báo giá</button>
          </div>
        `;
      } else if (req.status === 'quoted') {
        actionAreaHTML = `<div style="margin-top: 12px; color: var(--primary-hover); font-weight: 700;">Đã báo giá: ${req.quotedPrice.toLocaleString('vi-VN')}đ (Chờ khách duyệt)</div>`;
      } else if (req.status === 'confirmed') {
        actionAreaHTML = `<div style="margin-top: 12px; color: var(--success); font-weight: 700;">Khách đã chấp thuận báo giá & tạo đơn hàng!</div>`;
      }

      const imgUrl = req.sampleLayout || req.sampleImage || '/public/img/placeholder.jpg';
      const finalPkg = req.packageType || req.cakeType || 'Set tiệc ngọt';
      const finalSize = req.groupSize || req.size || '10-15 người';
      const finalTea = req.teaOption || req.flavor || 'Trà Ô long cam đào';
      const finalCorp = req.corporateName || req.mainColor || 'Không có';
      const finalTheme = req.eventTheme || req.textOnCake || 'Không có';

      return `
        <div class="order-history-card" style="margin-bottom: 16px;">
          <div style="display: grid; grid-template-columns: 120px 1fr; gap: 16px;">
            <img src="${imgUrl}" class="cake-thumbnail" onclick="window.open('${imgUrl}')" style="width: 120px; height: 120px; border-radius: var(--radius-md); object-fit: cover;">
            <div>
              <div style="display: flex; justify-content: space-between;">
                <h4 style="color: var(--primary-hover);">${finalPkg}</h4>
                <span class="oh-status ${req.status}">${req.status.toUpperCase()}</span>
              </div>
              <div style="font-size: 13px; margin-top: 8px;">
                <p><strong>Khách hàng:</strong> ${req.fullname} - SĐT: ${req.phone} | ${req.email}</p>
                <p><strong>Doanh nghiệp:</strong> ${finalCorp}</p>
                <p><strong>Quy mô:</strong> ${finalSize} | <strong>Lựa chọn trà:</strong> ${finalTea}</p>
                <p><strong>Chủ đề / Tông màu:</strong> <span style="background-color: var(--primary-light); padding: 2px 6px; border-radius: 4px;">"${finalTheme}"</span></p>
                <p><strong>Thời gian tổ chức:</strong> ${date} - Khung giờ: ${req.expectedTime}</p>
                <p><strong>Ghi chú bổ sung:</strong> ${req.note || 'Không có'}</p>
              </div>
            </div>
          </div>
          ${actionAreaHTML}
        </div>
      `;
    }).join('');
  };

  window.sendCustomQuote = async (reqId) => {
    const priceInput = document.getElementById(`quote-price-${reqId}`);
    const price = Number(priceInput.value);

    if (!price || price <= 0) {
      showToast('Vui lòng điền giá bán đề xuất lớn hơn 0', 'warning');
      return;
    }

    try {
      const data = await fetchAPI(`/api/custom-cakes/${reqId}/quote`, {
        method: 'PUT',
        body: JSON.stringify({ quotedPrice: price, note: 'Báo giá bánh thiết kế riêng theo mẫu' }),
      });

      if (data.success) {
        showToast(data.message, 'success');
        loadCustomCakes();
      }
    } catch (e) {}
  };

  // ================= TAB: CHAT / INTERNAL MESSAGING =================
  let activeChatUserId = '';

  const loadChatConversations = async () => {
    const userListEl = document.getElementById('chat-users-list');
    if (!userListEl) return;

    userListEl.innerHTML = '<div>Đang tải hội thoại...</div>';

    try {
      const data = await fetchAPI('/api/messages/conversations/list');
      if (data.success) {
        renderChatUsers(data.conversations);
      }
    } catch (e) {
      userListEl.innerHTML = '<div style="color: var(--danger);">Không thể tải danh sách chat.</div>';
    }
  };

  const renderChatUsers = (conversations) => {
    const userListEl = document.getElementById('chat-users-list');
    if (conversations.length === 0) {
      userListEl.innerHTML = '<div style="font-size: 13px; text-align: center; color: var(--gray-600); padding: 12px;">Chưa có cuộc hội thoại nào.</div>';
      return;
    }

    userListEl.innerHTML = conversations.map(conv => {
      const u = conv.user;
      if (!u) return '';
      const activeClass = u._id === activeChatUserId ? 'active' : '';
      const unreadBadge = conv.unreadCount > 0 ? `<span class="badge" style="position: relative; display: inline-flex; margin-left: 8px;">${conv.unreadCount}</span>` : '';

      return `
        <div class="chat-user-item ${activeClass}" onclick="openChatWindow('${u._id}', '${u.name}')">
          <div class="chat-user-name">${u.name} ${unreadBadge}</div>
          <div class="chat-user-last">${conv.lastMessage || 'Chưa gửi tin nhắn'}</div>
        </div>
      `;
    }).join('');
  };

  window.openChatWindow = async (userId, userName) => {
    activeChatUserId = userId;
    
    // Set active item styling
    loadChatConversations();

    const messagesBox = document.getElementById('chat-messages');
    const headerName = document.getElementById('chat-header-name');

    if (headerName) headerName.textContent = userName;
    if (messagesBox) {
      messagesBox.innerHTML = '<div>Đang nạp tin nhắn...</div>';

      try {
        const data = await fetchAPI(`/api/messages/${userId}`);
        if (data.success) {
          renderMessagesList(data.messages);
        }
      } catch (e) {
        messagesBox.innerHTML = '<div style="color: var(--danger);">Lỗi tải tin nhắn.</div>';
      }
    }
  };

  const renderMessagesList = (messages) => {
    const messagesBox = document.getElementById('chat-messages');
    if (messages.length === 0) {
      messagesBox.innerHTML = '<div style="text-align: center; color: var(--gray-600); padding: 24px;">Gửi tin nhắn chào mừng khách hàng đến với tiệm bánh!</div>';
      return;
    }

    messagesBox.innerHTML = messages.map(msg => {
      const alignClass = msg.senderId === activeChatUserId ? 'received' : 'sent';
      return `
        <div class="chat-msg ${alignClass}">
          ${msg.content}
        </div>
      `;
    }).join('');

    // scroll to bottom
    messagesBox.scrollTop = messagesBox.scrollHeight;
  };

  // Bind Send message button
  const sendMsgBtn = document.getElementById('chat-send-btn');
  const sendMsgInput = document.getElementById('chat-input');
  if (sendMsgBtn && sendMsgInput) {
    sendMsgBtn.addEventListener('click', async () => {
      const content = sendMsgInput.value.trim();
      if (!content || !activeChatUserId) return;

      try {
        const data = await fetchAPI('/api/messages', {
          method: 'POST',
          body: JSON.stringify({ receiverId: activeChatUserId, content }),
        });
        if (data.success) {
          sendMsgInput.value = '';
          openChatWindow(activeChatUserId, document.getElementById('chat-header-name').textContent);
        }
      } catch (e) {}
    });
  }

  // ================= TAB: CONTACTS & FEEDBACK TICKETS =================
  const loadContactTickets = async () => {
    const listEl = document.getElementById('contacts-tickets-list');
    if (!listEl) return;

    listEl.innerHTML = '<div class="text-center">Đang tải ý kiến khách hàng...</div>';

    try {
      const data = await fetchAPI('/api/contacts');
      if (data.success) {
        renderContacts(data.contacts);
      }
    } catch (e) {
      listEl.innerHTML = '<div class="text-center" style="color: var(--danger);">Không thể tải dữ liệu liên hệ.</div>';
    }
  };

  const renderContacts = (contacts) => {
    const listEl = document.getElementById('contacts-tickets-list');
    if (contacts.length === 0) {
      listEl.innerHTML = '<div class="text-center" style="padding: 24px; color: var(--gray-600);">Chưa nhận được phản hồi liên hệ nào.</div>';
      return;
    }

    listEl.innerHTML = contacts.map(c => {
      const date = new Date(c.createdAt).toLocaleDateString('vi-VN');
      
      let replyFormHTML = '';
      if (c.status === 'new' || c.status === 'processing') {
        replyFormHTML = `
          <div style="margin-top: 12px; border-top: 1px dashed var(--gray-200); padding-top: 12px;">
            <div class="form-group">
              <label style="font-size: 12px;">Trả lời khách hàng:</label>
              <textarea id="contact-reply-${c._id}" class="form-control" style="min-height: 80px; font-size: 13px;" placeholder="Nhập câu trả lời giải đáp thắc mắc...">${c.staffReply || ''}</textarea>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary" style="padding: 8px 16px; font-size: 12px;" onclick="sendContactReply('${c._id}', 'done')">Gửi và hoàn thành</button>
              <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;" onclick="sendContactReply('${c._id}', 'processing')">Lưu tạm</button>
            </div>
          </div>
        `;
      } else {
        replyFormHTML = `
          <div style="margin-top: 12px; background-color: var(--gray-100); border-radius: var(--radius-sm); padding: 12px; font-size: 13px;">
            <strong>Nội dung phản hồi từ tiệm:</strong>
            <div>${c.staffReply}</div>
          </div>
        `;
      }

      return `
        <div class="order-history-card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between;">
            <strong>Chủ đề: ${c.subject}</strong>
            <span class="oh-status ${c.status}">${c.status.toUpperCase()}</span>
          </div>
          <div style="font-size: 13px; color: var(--gray-600); margin: 6px 0;">
            Người gửi: <strong>${c.name}</strong> (${c.email} | SĐT: ${c.phone}) - Ngày gửi: ${date}
            ${c.orderCode ? `<br>Mã đơn liên quan: <strong>#${c.orderCode}</strong>` : ''}
          </div>
          <div style="font-size: 14px; background-color: var(--secondary); padding: 12px; border-radius: var(--radius-sm); margin: 10px 0;">
            ${c.content}
          </div>
          ${replyFormHTML}
        </div>
      `;
    }).join('');
  };

  window.sendContactReply = async (contactId, status) => {
    const replyText = document.getElementById(`contact-reply-${contactId}`).value.trim();
    if (!replyText) {
      showToast('Vui lòng điền câu trả lời khách hàng trước khi lưu', 'warning');
      return;
    }

    try {
      const data = await fetchAPI(`/api/contacts/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify({ staffReply: replyText, status }),
      });
      if (data.success) {
        showToast(data.message, 'success');
        loadContactTickets();
      }
    } catch (e) {}
  };

  // ================= TAB: MANUAL ORDER CREATION =================
  let manualOrderItems = [];

  const loadManualOrderForm = async () => {
    const productSelect = document.getElementById('manual-item-select');
    if (!productSelect) return;

    manualOrderItems = [];
    renderManualOrderItemsList();

    try {
      const data = await fetchAPI('/api/products?limit=100');
      if (data.success) {
        let options = '<option value="">-- Chọn sản phẩm bánh --</option>';
        data.products.forEach(p => {
          options += `<option value="${p._id}" data-name="${p.name}" data-price="${p.price}" data-sizes="${p.size.join(',')}" data-flavors="${p.flavor.join(',')}">${p.name} (${p.code}) - ${p.price.toLocaleString()}đ</option>`;
        });
        productSelect.innerHTML = options;
      }
    } catch (e) {}
  };

  // Add Item to manual basket list
  window.addManualOrderItem = () => {
    const selector = document.getElementById('manual-item-select');
    const selectedOpt = selector.options[selector.selectedIndex];
    if (!selector.value) {
      showToast('Vui lòng chọn sản phẩm bánh', 'warning');
      return;
    }

    const productId = selector.value;
    const name = selectedOpt.dataset.name;
    const price = Number(selectedOpt.dataset.price);

    // Build sub selectors dynamically or just read defaults
    const sizes = selectedOpt.dataset.sizes.split(',');
    const flavors = selectedOpt.dataset.flavors.split(',');

    const quantity = Number(document.getElementById('manual-item-qty').value) || 1;
    const size = sizes[0] || 'Standard';
    const flavor = flavors[0] || 'Vani';
    const note = document.getElementById('manual-item-note').value;

    manualOrderItems.push({ productId, name, price, quantity, size, flavor, note });
    renderManualOrderItemsList();

    // Reset item input field
    document.getElementById('manual-item-note').value = '';
    document.getElementById('manual-item-qty').value = '1';
    selector.value = '';
  };

  const renderManualOrderItemsList = () => {
    const listEl = document.getElementById('manual-items-list');
    if (!listEl) return;

    if (manualOrderItems.length === 0) {
      listEl.innerHTML = '<div style="color: var(--gray-600); font-style: italic; font-size: 13px;">Chưa chọn bánh nào.</div>';
      return;
    }

    let itemsHTML = '';
    let total = 0;

    manualOrderItems.forEach((item, idx) => {
      const subtotal = item.price * item.quantity;
      total += subtotal;

      itemsHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed var(--gray-200);">
          <div>
            <strong>${item.name}</strong> (${item.size} | ${item.flavor}) x ${item.quantity}
            ${item.note ? `<div style="font-size: 11px; color: var(--gray-600);">"${item.note}"</div>` : ''}
          </div>
          <div>
            <span>${subtotal.toLocaleString()}đ</span>
            <button type="button" style="background: none; border: none; color: var(--danger); margin-left: 8px; font-weight: 700; cursor: pointer;" onclick="removeManualItem(${idx})">&times;</button>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = `
      ${itemsHTML}
      <div style="text-align: right; font-weight: 700; font-size: 15px; margin-top: 12px; color: var(--primary-hover);">
        Tạm tính: ${total.toLocaleString()}đ
      </div>
    `;
  };

  window.removeManualItem = (idx) => {
    manualOrderItems.splice(idx, 1);
    renderManualOrderItemsList();
  };

  // Submit manual order Form
  const manualForm = document.getElementById('manual-order-form');
  if (manualForm) {
    manualForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (manualOrderItems.length === 0) {
        showToast('Vui lòng chọn ít nhất một sản phẩm bánh vào đơn hàng', 'warning');
        return;
      }

      const fullname = document.getElementById('manual-customer-name').value.trim();
      const phone = document.getElementById('manual-customer-phone').value.trim();
      const email = document.getElementById('manual-customer-email').value.trim() || 'guest@gmail.com';
      const address = document.getElementById('manual-customer-address').value.trim();
      const deliveryDate = document.getElementById('manual-customer-date').value;
      const deliveryTime = document.getElementById('manual-customer-time').value;
      const paymentMethod = document.getElementById('manual-payment-method').value;
      const paymentStatus = document.getElementById('manual-payment-status').value;
      const promoCode = document.getElementById('manual-customer-coupon').value.trim();
      const note = document.getElementById('manual-customer-note').value.trim();

      const bodyData = {
        fullname,
        phone,
        email,
        address,
        items: manualOrderItems,
        deliveryDate,
        deliveryTime,
        paymentMethod,
        paymentStatus,
        promoCode,
        note,
      };

      try {
        const data = await fetchAPI('/api/orders/manual', {
          method: 'POST',
          body: JSON.stringify(bodyData),
        });

        if (data.success) {
          showToast(data.message, 'success');
          manualForm.reset();
          manualOrderItems = [];
          renderManualOrderItemsList();
          switchTab('tab-orders');
        }
      } catch (err) {}
    });
  }

  // ================= TAB: MESSAGES SUBTAB TOGGLING =================
  const loadMessagesWorkspace = () => {
    const isContacts = document.getElementById('subtab-contacts-btn').classList.contains('active');
    if (isContacts) {
      loadContactTickets();
    } else {
      loadChatConversations();
    }
  };

  window.switchMessagesSubTab = (subtab) => {
    const chatBtn = document.getElementById('subtab-chat-btn');
    const contactsBtn = document.getElementById('subtab-contacts-btn');
    const chatContent = document.getElementById('subtab-chat-content');
    const contactsContent = document.getElementById('subtab-contacts-content');

    if (!chatBtn || !contactsBtn || !chatContent || !contactsContent) return;

    if (subtab === 'chat') {
      chatBtn.classList.add('active');
      contactsBtn.classList.remove('active');
      chatContent.style.display = 'block';
      contactsContent.style.display = 'none';
      loadChatConversations();
    } else {
      contactsBtn.classList.add('active');
      chatBtn.classList.remove('active');
      contactsContent.style.display = 'block';
      chatContent.style.display = 'none';
      loadContactTickets();
    }
  };

  // Initial load
  switchTab('tab-stats');
});
