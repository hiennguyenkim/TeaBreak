// Customer Dashboard Script
document.addEventListener('DOMContentLoaded', async () => {
  const dashboardContainer = document.getElementById('user-dashboard-container');
  if (!dashboardContainer) return;

  // Security check: Redirect guest users
  try {
    const data = await fetchAPI('/api/auth/me', { silent: true });
    if (!data.success || data.user.role !== 'user') {
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

    if (nameEl) nameEl.textContent = user.name || 'Khách hàng';
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

    // Also update form preview if exists
    const previewImg = document.getElementById('profile-avatar-preview');
    const placeholderEl = document.getElementById('profile-avatar-placeholder');
    if (previewImg && placeholderEl) {
      if (user.avatar) {
        previewImg.src = user.avatar;
        previewImg.style.display = 'block';
        placeholderEl.style.display = 'none';
      } else {
        previewImg.src = '';
        previewImg.style.display = 'none';
        placeholderEl.style.display = 'flex';
      }
    }
  }

  // Handle instant avatar file preview
  const avatarFileInput = document.getElementById('profile-avatar-file');
  if (avatarFileInput) {
    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const previewImg = document.getElementById('profile-avatar-preview');
        const placeholderEl = document.getElementById('profile-avatar-placeholder');
        if (previewImg && placeholderEl) {
          const reader = new FileReader();
          reader.onload = (event) => {
            previewImg.src = event.target.result;
            previewImg.style.display = 'block';
            placeholderEl.style.display = 'none';
          };
          reader.readAsDataURL(file);
        }
      }
    });
  }

  // Active tab state management
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

    // Run tab-specific loader
    if (tabId === 'tab-profile') loadProfileData();
    if (tabId === 'tab-orders') loadOrderHistory();
    if (tabId === 'tab-addresses') loadAddressBook();
    if (tabId === 'tab-wishlist') loadWishlist();
    if (tabId === 'tab-teabreak') loadTeaBreakRequests();
  };

  tabMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.dataset.tab);
    });
  });

  // ================= TAB: PROFILE =================
  const loadProfileData = async () => {
    try {
      const data = await fetchAPI('/api/auth/me');
      if (data.success && data.user) {
        document.getElementById('profile-name').value = data.user.name || '';
        document.getElementById('profile-email').value = data.user.email || '';
        document.getElementById('profile-phone').value = data.user.phone || '';
        document.getElementById('profile-address').value = data.user.address || '';
        updateDashboardUserCard(data.user);
      }
    } catch (e) {}
  };

  // Submit profile edits
  const profileForm = document.getElementById('profile-edit-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-name').value.trim();
      const phone = document.getElementById('profile-phone').value.trim();
      const address = document.getElementById('profile-address').value.trim();
      const fileInput = document.getElementById('profile-avatar-file');

      if (!name) {
        showToast('Họ tên không được bỏ trống!', 'warning');
        return;
      }

      const phoneRegex = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (phone && !phoneRegex.test(phone)) {
        showToast('Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0988888888)!', 'warning');
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('address', address);
      if (fileInput && fileInput.files.length > 0) {
        formData.append('avatarFile', fileInput.files[0]);
      }

      try {
        const data = await fetchAPI('/api/users/profile', {
          method: 'PUT',
          body: formData,
        });
        if (data.success) {
          showToast(data.message, 'success');
          if (data.user) {
            updateDashboardUserCard(data.user);
          }
        }
      } catch (err) {}
    });
  }

  // Change Password form handler
  const pwdForm = document.getElementById('profile-password-form');
  if (pwdForm) {
    pwdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('profile-curr-password').value;
      const newPassword = document.getElementById('profile-new-password').value;
      const confirmPwd = document.getElementById('profile-confirm-password').value;

      if (!currentPassword) {
        showToast('Vui lòng nhập mật khẩu hiện tại!', 'warning');
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        showToast('Mật khẩu mới phải chứa ít nhất 6 ký tự!', 'warning');
        return;
      }

      if (newPassword !== confirmPwd) {
        showToast('Mật khẩu mới nhập lại không khớp!', 'warning');
        return;
      }

      try {
        const data = await fetchAPI('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        if (data.success) {
          showToast(data.message, 'success');
          pwdForm.reset();
        }
      } catch (err) {}
    });
  }

  // ================= TAB: ORDERS =================
  const loadOrderHistory = async () => {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    ordersList.innerHTML = '<div class="text-center" style="padding: 24px;">Đang tải lịch sử đơn hàng...</div>';

    try {
      const data = await fetchAPI('/api/orders');
      if (data.success) {
        renderOrdersList(data.orders);
      }
    } catch (e) {
      ordersList.innerHTML = '<div class="text-center" style="color: var(--danger);">Không thể tải danh sách đơn hàng.</div>';
    }
  };

  const renderOrdersList = (orders) => {
    const ordersList = document.getElementById('orders-list');
    if (orders.length === 0) {
      ordersList.innerHTML = '<div class="text-center" style="padding: 40px; color: var(--gray-600);">Bạn chưa mua đơn hàng nào tại tiệm bánh.</div>';
      return;
    }

    ordersList.innerHTML = orders.map(order => {
      const date = new Date(order.createdAt).toLocaleDateString('vi-VN');
      const itemsList = order.items.map(item => `
        <div class="oh-item">${item.name} (${item.size} | ${item.flavor}) x ${item.quantity}</div>
      `).join('');

      // Actions button
      let actionsHTML = '';
      if (order.orderStatus === 'pending') {
        actionsHTML = `<button class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" onclick="cancelCustomerOrder('${order._id}')">Hủy đơn</button>`;
      } else if (order.orderStatus === 'completed') {
        actionsHTML = `<button class="btn btn-primary" style="padding: 6px 12px; font-size: 13px;" onclick="openReviewModal('${order._id}', '${order.items[0].productId}')">Đánh giá sản phẩm</button>`;
      }

      return `
        <div class="order-history-card">
          <div class="oh-header">
            <div>
              <span class="oh-code">#${order.orderCode}</span>
              <span class="text-muted" style="margin-left: 12px; font-size: 13px;">Ngày đặt: ${date}</span>
            </div>
            <span class="oh-status ${order.orderStatus}">${translateStatus(order.orderStatus)}</span>
          </div>
          <div class="oh-items">
            ${itemsList}
          </div>
          <div class="oh-footer">
            <div>Thành tiền: <span class="oh-total text-primary">${order.finalAmount.toLocaleString('vi-VN')}đ</span></div>
            <div class="actions-row">
              <a href="/order-tracking.html?code=${order.orderCode}&phone=${order.phone}" class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px;">Theo dõi</a>
              ${actionsHTML}
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  const translateStatus = (status) => {
    const statuses = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang làm bánh',
      shipping: 'Đang giao bánh',
      delivered: 'Đã giao bánh',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
    };
    return statuses[status] || status;
  };

  window.cancelCustomerOrder = async (orderId) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;

    try {
      const data = await fetchAPI(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      if (data.success) {
        showToast(data.message, 'success');
        loadOrderHistory();
      }
    } catch (e) {}
  };

  // ================= TAB: ADDRESSES =================
  const loadAddressBook = async () => {
    const addressesList = document.getElementById('addresses-list');
    if (!addressesList) return;

    addressesList.innerHTML = '<div class="text-center" style="padding: 20px;">Đang tải sổ địa chỉ...</div>';

    try {
      const data = await fetchAPI('/api/users/addresses');
      if (data.success) {
        renderAddresses(data.addresses);
      }
    } catch (e) {
      addressesList.innerHTML = '<div class="text-center" style="color: var(--danger);">Không thể tải sổ địa chỉ.</div>';
    }
  };

  const renderAddresses = (addresses) => {
    const addressesList = document.getElementById('addresses-list');
    if (addresses.length === 0) {
      addressesList.innerHTML = '<div class="text-center" style="padding: 24px; color: var(--gray-600);">Bạn chưa lưu địa chỉ nhận hàng nào.</div>';
      return;
    }

    addressesList.innerHTML = `
      <div class="address-grid">
        ${addresses.map(addr => `
          <div class="address-card ${addr.isDefault ? 'default' : ''}">
            ${addr.isDefault ? '<span class="address-badge">MẶC ĐỊNH</span>' : ''}
            <div style="font-weight: 700; margin-bottom: 8px;">${addr.receiverName}</div>
            <div style="font-size: 14px; color: var(--gray-600); margin-bottom: 4px;">📞 SĐT: ${addr.phone}</div>
            <div style="font-size: 14px;">🏠 ${addr.addressDetail}, ${addr.ward}, ${addr.district}, ${addr.city}</div>
            
            <div class="address-actions">
              ${!addr.isDefault ? `<button class="address-action-btn" onclick="setDefaultAddress('${addr._id}')">Đặt mặc định</button>` : ''}
              <button class="address-action-btn delete" onclick="deleteAddressBookItem('${addr._id}')">Xóa</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  window.setDefaultAddress = async (addressId) => {
    try {
      const data = await fetchAPI(`/api/users/addresses/${addressId}`, {
        method: 'PUT',
        body: JSON.stringify({ isDefault: true }),
      });
      if (data.success) {
        showToast(data.message, 'success');
        loadAddressBook();
      }
    } catch (e) {}
  };

  window.deleteAddressBookItem = async (addressId) => {
    if (!confirm('Bạn có muốn xóa địa chỉ này khỏi danh mục của bạn không?')) return;

    try {
      const data = await fetchAPI(`/api/users/addresses/${addressId}`, { method: 'DELETE' });
      if (data.success) {
        showToast(data.message, 'success');
        loadAddressBook();
      }
    } catch (e) {}
  };

  // Add Address Form handler
  const addressForm = document.getElementById('address-add-form');
  if (addressForm) {
    addressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const receiverName = document.getElementById('address-name').value.trim();
      const phone = document.getElementById('address-phone').value.trim();
      const addressDetail = document.getElementById('address-detail').value.trim();
      const ward = document.getElementById('address-ward').value.trim();
      const district = document.getElementById('address-district').value.trim();
      const city = document.getElementById('address-city').value.trim();
      const isDefault = document.getElementById('address-default').checked;

      try {
        const data = await fetchAPI('/api/users/addresses', {
          method: 'POST',
          body: JSON.stringify({ receiverName, phone, addressDetail, ward, district, city, isDefault }),
        });

        if (data.success) {
          showToast(data.message, 'success');
          addressForm.reset();
          loadAddressBook();
        }
      } catch (err) {}
    });
  }

  // ================= TAB: WISHLIST =================
  const loadWishlist = async () => {
    const wishlistGrid = document.getElementById('wishlist-grid');
    if (!wishlistGrid) return;

    const wishlistIds = JSON.parse(localStorage.getItem('wishlist')) || [];
    if (wishlistIds.length === 0) {
      wishlistGrid.innerHTML = '<div class="text-center" style="padding: 40px; color: var(--gray-600); grid-column: 1/-1;">Không có sản phẩm yêu thích nào.</div>';
      return;
    }

    wishlistGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1;">Đang tải danh sách yêu thích...</div>';

    try {
      const products = [];
      for (const id of wishlistIds) {
        try {
          const res = await fetchAPI(`/api/products/${id}`);
          if (res.success && res.product) {
            products.push(res.product);
          }
        } catch (e) {
          // ignore error (deleted product reference, etc.)
        }
      }
      renderWishlist(products);
    } catch (e) {
      wishlistGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; color: var(--danger);">Không thể tải wishlist.</div>';
    }
  };

  const renderWishlist = (products) => {
    const wishlistGrid = document.getElementById('wishlist-grid');
    if (products.length === 0) {
      wishlistGrid.innerHTML = '<div class="text-center" style="padding: 40px; color: var(--gray-600); grid-column: 1/-1;">Không có sản phẩm yêu thích nào.</div>';
      return;
    }

    wishlistGrid.innerHTML = products.map(product => {
      const price = product.discountPrice || product.price;
      const image = product.images[0] || '/public/img/placeholder.jpg';
      return `
        <div class="product-card" style="padding: 10px;">
          <a href="/product-detail.html?slug=${product.slug}">
            <img src="${image}" style="border-radius: var(--radius-md); object-fit: cover; height: 160px; width: 100%;">
          </a>
          <h4 style="margin: 8px 0; font-size: 14px;"><a href="/product-detail.html?slug=${product.slug}">${product.name}</a></h4>
          <div style="font-weight: 700; color: var(--primary-hover); font-size: 14px;">${price.toLocaleString('vi-VN')}đ</div>
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <button class="btn btn-primary" onclick="quickAddCart('${product._id}', '${product.size[0] || 'Standard'}', '${product.flavor[0] || 'Vani'}')" style="padding: 6px; font-size: 11px; flex-grow: 1;">Thêm giỏ</button>
            <button class="btn btn-secondary" onclick="removeWishlistItem('${product._id}')" style="padding: 6px; font-size: 11px; background-color: var(--danger-color); color: var(--danger);">&times;</button>
          </div>
        </div>
      `;
    }).join('');
  };

  window.removeWishlistItem = (productId) => {
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    wishlist = wishlist.filter(id => id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    loadWishlist();
  };

  // ================= MODAL: REVIEW SUBMIT =================
  let activeReviewOrderId = '';
  let activeReviewProductId = '';

  window.openReviewModal = (orderId, productId) => {
    activeReviewOrderId = orderId;
    activeReviewProductId = productId;

    // Create a dynamic modal container overlay
    let modal = document.getElementById('review-overlay-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'review-overlay-modal';
      modal.className = 'admin-modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content-card">
        <div class="modal-header-row">
          <h3>Đánh giá chất lượng bánh</h3>
          <button class="modal-close-btn" onclick="closeReviewModal()">&times;</button>
        </div>
        <form id="customer-review-form" onsubmit="submitReview(event)">
          <div class="form-group">
            <label>Số sao đánh giá (1 - 5 sao):</label>
            <select id="review-stars-input" class="form-control" required>
              <option value="5">⭐⭐⭐⭐⭐ (5 sao - Tuyệt vời)</option>
              <option value="4">⭐⭐⭐⭐ (4 sao - Tốt)</option>
              <option value="3">⭐⭐⭐ (3 sao - Tạm được)</option>
              <option value="2">⭐⭐ (2 sao - Chưa hài lòng)</option>
              <option value="1">⭐ (1 sao - Rất tệ)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Nội dung nhận xét:</label>
            <textarea id="review-content-input" class="form-control" placeholder="Viết cảm nhận của bạn về độ tươi, hương vị, cách trang trí bánh..." required></textarea>
          </div>
          <div class="form-group">
            <label>Tải ảnh thực tế (Tùy chọn):</label>
            <input type="file" id="review-photos-input" class="form-control" multiple accept="image/*">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Gửi đánh giá</button>
        </form>
      </div>
    `;

    modal.style.display = 'flex';
  };

  window.closeReviewModal = () => {
    const modal = document.getElementById('review-overlay-modal');
    if (modal) modal.style.display = 'none';
  };

  window.submitReview = async (event) => {
    event.preventDefault();
    const rating = document.getElementById('review-stars-input').value;
    const content = document.getElementById('review-content-input').value.trim();
    const fileInput = document.getElementById('review-photos-input');

    const formData = new FormData();
    formData.append('orderId', activeReviewOrderId);
    formData.append('productId', activeReviewProductId);
    formData.append('rating', rating);
    formData.append('content', content);

    if (fileInput.files.length > 0) {
      for (let i = 0; i < fileInput.files.length; i++) {
        formData.append('images', fileInput.files[i]);
      }
    }

    try {
      const data = await fetchAPI('/api/reviews', {
        method: 'POST',
        body: formData,
      });

      if (data.success) {
        showToast(data.message, 'success');
        closeReviewModal();
        loadOrderHistory();
      }
    } catch (err) {}
  };

  // ================= TAB: TEA BREAK REQUESTS =================
  const loadTeaBreakRequests = async () => {
    const listEl = document.getElementById('teabreak-requests-list');
    if (!listEl) return;

    listEl.innerHTML = '<div class="text-center" style="padding: 24px;">Đang tải danh sách yêu cầu tiệc...</div>';

    try {
      const data = await fetchAPI('/api/teabreak-requests/my');
      if (data.success) {
        renderTeaBreakRequests(data.requests);
      }
    } catch (e) {
      listEl.innerHTML = '<div class="text-center" style="color: var(--danger);">Không thể tải danh sách yêu cầu.</div>';
    }
  };

  const renderTeaBreakRequests = (requests) => {
    const listEl = document.getElementById('teabreak-requests-list');
    if (requests.length === 0) {
      listEl.innerHTML = '<div class="text-center" style="padding: 40px; color: var(--gray-600);">Bạn chưa gửi yêu cầu đặt tiệc Tea Break nào. <a href="/teabreak.html" style="color: var(--primary-hover); font-weight: 700;">Gửi yêu cầu ngay!</a></div>';
      return;
    }

    listEl.innerHTML = requests.map(req => {
      const date = new Date(req.expectedDate).toLocaleDateString('vi-VN');
      
      let actionHTML = '';
      if (req.status === 'quoted' && req.quotedPrice > 0) {
        actionHTML = `
          <div style="margin-top: 16px; border-top: 1px solid var(--gray-200); padding-top: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>Báo giá từ tiệm: <span class="oh-total text-primary" style="font-size: 18px;">${req.quotedPrice.toLocaleString('vi-VN')}đ</span></div>
            <button class="btn btn-primary" onclick="acceptTeaBreakQuote('${req._id}')">Chấp nhận & Đặt tiệc</button>
          </div>
        `;
      } else if (req.status === 'confirmed') {
        actionHTML = `<div style="margin-top: 12px; color: var(--success); font-weight: 700; font-size: 14px;">✓ Yêu cầu đã được xác nhận & chuyển thành đơn hàng!</div>`;
      } else if (req.status === 'pending') {
        actionHTML = `<div style="margin-top: 12px; color: var(--gray-600); font-style: italic; font-size: 14px;">Đang chờ nhân viên liên hệ tư vấn và báo giá...</div>`;
      }

      return `
        <div class="order-history-card" style="margin-bottom: 16px;">
          <div style="display: grid; grid-template-columns: 100px 1fr; gap: 16px;">
            <img src="${req.sampleLayout || '/public/img/placeholder.jpg'}" onclick="window.open('${req.sampleLayout}')" style="width: 100px; height: 100px; border-radius: var(--radius-md); object-fit: cover; cursor: pointer;">
            <div>
              <div style="display: flex; justify-content: space-between;">
                <h4 style="color: var(--primary-hover);">${req.packageType}</h4>
                <span class="oh-status ${req.status}">${req.status.toUpperCase()}</span>
              </div>
              <div style="font-size: 13px; margin-top: 8px;">
                <p><strong>Quy mô:</strong> ${req.groupSize} | <strong>Trà đi kèm:</strong> ${req.teaOption}</p>
                <p><strong>Ngày tổ chức:</strong> ${date} lúc ${req.expectedTime}</p>
                <p><strong>Doanh nghiệp:</strong> ${req.corporateName || 'Cá nhân'}</p>
                <p><strong>Chủ đề:</strong> ${req.eventTheme || 'Không có'}</p>
                <p><strong>Ghi chú:</strong> ${req.note || 'Không có'}</p>
              </div>
            </div>
          </div>
          ${actionHTML}
        </div>
      `;
    }).join('');
  };

  window.acceptTeaBreakQuote = async (reqId) => {
    const address = prompt('Vui lòng điền địa chỉ giao nhận & setup tiệc:', '');
    if (address === null) return; // cancel
    if (!address.trim()) {
      showToast('Vui lòng nhập địa chỉ nhận hàng', 'warning');
      return;
    }

    try {
      const data = await fetchAPI(`/api/teabreak-requests/${reqId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod: 'cod', address }),
      });
      if (data.success) {
        showToast(data.message, 'success');
        loadTeaBreakRequests();
      }
    } catch (e) {}
  };

  // Initial load
  switchTab('tab-profile');
});
