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

  // Vietnam Administrative Regions Population Dropdowns Helper
  const populateAddressDropdowns = (citySelect, districtSelect, wardSelect, initialData = null) => {
    const regions = window.vietnamRegions || {};
    const provinces = window.otherProvinces || [];

    citySelect.innerHTML = '<option value="">-- Chọn Tỉnh/Thành phố --</option>';
    
    // Major cities
    const majorCities = Object.keys(regions);
    majorCities.forEach(city => {
      citySelect.innerHTML += `<option value="${city}">${city}</option>`;
    });
    
    // Other provinces
    provinces.forEach(prov => {
      citySelect.innerHTML += `<option value="${prov}">${prov}</option>`;
    });

    const handleCityChange = () => {
      const selectedCity = citySelect.value;
      if (regions[selectedCity]) {
        // Swap inputs back to select if they were inputs
        if (districtSelect.tagName === 'INPUT') {
          const newSelect = document.createElement('select');
          newSelect.id = districtSelect.id;
          newSelect.className = 'form-control';
          newSelect.required = true;
          districtSelect.parentNode.replaceChild(newSelect, districtSelect);
          districtSelect = newSelect;
          districtSelect.addEventListener('change', handleDistrictChange);
        }
        if (wardSelect.tagName === 'INPUT') {
          const newSelect = document.createElement('select');
          newSelect.id = wardSelect.id;
          newSelect.className = 'form-control';
          newSelect.required = true;
          wardSelect.parentNode.replaceChild(newSelect, wardSelect);
          wardSelect = newSelect;
        }

        districtSelect.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
        Object.keys(regions[selectedCity]).forEach(dist => {
          districtSelect.innerHTML += `<option value="${dist}">${dist}</option>`;
        });
        wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
      } else if (selectedCity) {
        // Other province - swap to input text
        if (districtSelect.tagName === 'SELECT') {
          const newInput = document.createElement('input');
          newInput.type = 'text';
          newInput.id = districtSelect.id;
          newInput.className = 'form-control';
          newInput.placeholder = 'Nhập Quận/Huyện';
          newInput.required = true;
          districtSelect.parentNode.replaceChild(newInput, districtSelect);
          districtSelect = newInput;
        }
        if (wardSelect.tagName === 'SELECT') {
          const newInput = document.createElement('input');
          newInput.type = 'text';
          newInput.id = wardSelect.id;
          newInput.className = 'form-control';
          newInput.placeholder = 'Nhập Phường/Xã';
          newInput.required = true;
          wardSelect.parentNode.replaceChild(newInput, wardSelect);
          wardSelect = newInput;
        }
      } else {
        if (districtSelect.tagName === 'SELECT') districtSelect.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
        if (wardSelect.tagName === 'SELECT') wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
      }
    };

    const handleDistrictChange = () => {
      const selectedCity = citySelect.value;
      const selectedDistrict = districtSelect.value;
      if (regions[selectedCity] && regions[selectedCity][selectedDistrict] && wardSelect.tagName === 'SELECT') {
        wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
        regions[selectedCity][selectedDistrict].forEach(w => {
          wardSelect.innerHTML += `<option value="${w}">${w}</option>`;
        });
      }
    };

    citySelect.addEventListener('change', handleCityChange);
    if (districtSelect.tagName === 'SELECT') {
      districtSelect.addEventListener('change', handleDistrictChange);
    }

    if (initialData) {
      citySelect.value = initialData.city;
      handleCityChange();
      if (districtSelect.tagName === 'SELECT') {
        districtSelect.value = initialData.district;
        handleDistrictChange();
        if (wardSelect.tagName === 'SELECT') {
          wardSelect.value = initialData.ward;
        } else {
          wardSelect.value = initialData.ward;
        }
      } else {
        districtSelect.value = initialData.district;
        wardSelect.value = initialData.ward;
      }
    }
  };

  // Initialize add address form dropdowns
  const addressCity = document.getElementById('address-city');
  const addressDistrict = document.getElementById('address-district');
  const addressWard = document.getElementById('address-ward');
  if (addressCity && addressDistrict && addressWard) {
    populateAddressDropdowns(addressCity, addressDistrict, addressWard);
  }

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

      const phoneInput = document.getElementById('profile-phone');
      hideFieldError(phoneInput);
      const phoneRegex = /^0\d{8}$|^0\d{10}$/;
      if (phone && !phoneRegex.test(phone)) {
        showFieldError(phoneInput, 'Số điện thoại bắt đầu bằng số 0, gồm 9 hoặc 11 chữ số');
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

      let actionsHTML = '';
      if (['pending', 'confirmed', 'preparing'].includes(order.orderStatus)) {
        actionsHTML = `
          <button class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" onclick="editCustomerOrder('${order._id}')">Chỉnh sửa đơn</button>
          <button class="btn btn-outline" style="padding: 6px 12px; font-size: 13px; margin-left: 4px;" onclick="cancelCustomerOrder('${order._id}')">Hủy đơn</button>
        `;
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
    showConfirmModal('Bạn có chắc chắn muốn hủy đơn hàng này không?', async () => {
      try {
        const data = await fetchAPI(`/api/orders/${orderId}/cancel`, { method: 'POST' });
        if (data.success) {
          showToast(data.message, 'success');
          loadOrderHistory();
        }
      } catch (e) {}
    });
  };

  // Edit Order Logic
  window.editCustomerOrder = async (orderId) => {
    try {
      const data = await fetchAPI(`/api/orders/${orderId}`);
      if (data.success && data.order) {
        const order = data.order;
        document.getElementById('edit-order-id').value = order._id;
        document.getElementById('edit-order-fullname').value = order.fullname;
        document.getElementById('edit-order-phone').value = order.phone;
        document.getElementById('edit-order-address').value = order.address;
        document.getElementById('edit-order-time').value = order.deliveryTime || '12:00';
        document.getElementById('edit-order-note').value = order.note || '';

        const itemsList = document.getElementById('edit-order-items-list');
        itemsList.innerHTML = order.items.map(item => `
          <div class="edit-order-item-row" data-product-id="${item.productId}" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--gray-200); padding-bottom: 8px;">
            <div style="font-size: 14px;">${item.name} (${item.size} | ${item.flavor})</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 12px; margin-bottom: 0;">SL:</label>
              <input type="number" class="form-control item-qty-input" value="${item.quantity}" min="1" style="width: 70px; padding: 4px; font-size: 13px;">
              <input type="hidden" class="item-size-input" value="${item.size}">
              <input type="hidden" class="item-flavor-input" value="${item.flavor}">
            </div>
          </div>
        `).join('');

        document.getElementById('edit-order-modal').classList.add('active');
      }
    } catch (e) {}
  };

  window.closeEditOrderModal = () => {
    document.getElementById('edit-order-modal').classList.remove('active');
  };

  const orderEditForm = document.getElementById('order-edit-form');
  if (orderEditForm) {
    orderEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const orderId = document.getElementById('edit-order-id').value;
      const fullname = document.getElementById('edit-order-fullname').value.trim();
      const phone = document.getElementById('edit-order-phone').value.trim();
      const address = document.getElementById('edit-order-address').value.trim();
      const deliveryTime = document.getElementById('edit-order-time').value;
      const note = document.getElementById('edit-order-note').value.trim();

      const phoneInput = document.getElementById('edit-order-phone');
      hideFieldError(phoneInput);
      const phoneRegex = /^0\d{8}$|^0\d{10}$/;
      if (phone && !phoneRegex.test(phone)) {
        showFieldError(phoneInput, 'Số điện thoại bắt đầu bằng số 0, gồm 9 hoặc 11 chữ số');
        return;
      }

      const itemRows = document.querySelectorAll('.edit-order-item-row');
      const items = Array.from(itemRows).map(row => {
        return {
          productId: row.dataset.productId,
          quantity: parseInt(row.querySelector('.item-qty-input').value, 10),
          size: row.querySelector('.item-size-input').value,
          flavor: row.querySelector('.item-flavor-input').value
        };
      });

      try {
        const data = await fetchAPI(`/api/orders/${orderId}`, {
          method: 'PUT',
          body: JSON.stringify({ fullname, phone, address, deliveryTime, note, items })
        });
        if (data.success) {
          showToast(data.message, 'success');
          closeEditOrderModal();
          loadOrderHistory();
        }
      } catch (e) {}
    });
  }

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
              <button class="address-action-btn" onclick="editAddressBookItem('${addr._id}')">Sửa</button>
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
    showConfirmModal('Bạn có chắc muốn xóa địa chỉ này không?', async () => {
      try {
        const data = await fetchAPI(`/api/users/addresses/${addressId}`, { method: 'DELETE' });
        if (data.success) {
          showToast(data.message, 'success');
          loadAddressBook();
        }
      } catch (e) {}
    });
  };

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

      const phoneInput = document.getElementById('address-phone');
      hideFieldError(phoneInput);
      const phoneRegex = /^0\d{8}$|^0\d{10}$/;
      if (phone && !phoneRegex.test(phone)) {
        showFieldError(phoneInput, 'Số điện thoại bắt đầu bằng số 0, gồm 9 hoặc 11 chữ số');
        return;
      }

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

  // Edit Address Book item
  window.editAddressBookItem = async (addressId) => {
    try {
      const addressesRes = await fetchAPI('/api/users/addresses');
      if (addressesRes.success) {
        const addr = addressesRes.addresses.find(a => a._id === addressId);
        if (addr) {
          document.getElementById('edit-address-id').value = addr._id;
          document.getElementById('edit-address-name').value = addr.receiverName;
          document.getElementById('edit-address-phone').value = addr.phone;
          document.getElementById('edit-address-detail').value = addr.addressDetail;
          document.getElementById('edit-address-default').checked = addr.isDefault;

          const modal = document.getElementById('edit-address-modal');
          const editCity = document.getElementById('edit-address-city');
          const editDistrict = document.getElementById('edit-address-district');
          const editWard = document.getElementById('edit-address-ward');

          populateAddressDropdowns(editCity, editDistrict, editWard, {
            city: addr.city,
            district: addr.district,
            ward: addr.ward
          });

          modal.classList.add('active');
        }
      }
    } catch (e) {}
  };

  window.closeEditAddressModal = () => {
    const modal = document.getElementById('edit-address-modal');
    if (modal) modal.classList.remove('active');
  };

  const addressEditForm = document.getElementById('address-edit-form');
  if (addressEditForm) {
    addressEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const addressId = document.getElementById('edit-address-id').value;
      const receiverName = document.getElementById('edit-address-name').value.trim();
      const phone = document.getElementById('edit-address-phone').value.trim();
      const addressDetail = document.getElementById('edit-address-detail').value.trim();
      const city = document.getElementById('edit-address-city').value.trim();
      const district = document.getElementById('edit-address-district').value.trim();
      const ward = document.getElementById('edit-address-ward').value.trim();
      const isDefault = document.getElementById('edit-address-default').checked;

      const phoneInput = document.getElementById('edit-address-phone');
      hideFieldError(phoneInput);
      const phoneRegex = /^0\d{8}$|^0\d{10}$/;
      if (phone && !phoneRegex.test(phone)) {
        showFieldError(phoneInput, 'Số điện thoại bắt đầu bằng số 0, gồm 9 hoặc 11 chữ số');
        return;
      }

      try {
        const data = await fetchAPI(`/api/users/addresses/${addressId}`, {
          method: 'PUT',
          body: JSON.stringify({ receiverName, phone, addressDetail, ward, district, city, isDefault }),
        });

        if (data.success) {
          showToast(data.message, 'success');
          closeEditAddressModal();
          loadAddressBook();
        }
      } catch (err) {}
    });
  }

  // ================= TAB: WISHLIST =================
  const loadWishlist = async () => {
    const wishlistGrid = document.getElementById('wishlist-grid');
    if (!wishlistGrid) return;

    wishlistGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1;">Đang tải danh sách yêu thích...</div>';

    try {
      const data = await fetchAPI('/api/users/wishlist');
      if (data.success) {
        renderWishlist(data.wishlist || []);
      }
    } catch (e) {
      wishlistGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; color: var(--danger);">Không thể tải danh sách sản phẩm yêu thích.</div>';
    }
  };

  const renderWishlist = (products) => {
    const wishlistGrid = document.getElementById('wishlist-grid');
    if (products.length === 0) {
      wishlistGrid.innerHTML = '<div class="text-center" style="padding: 40px; color: var(--gray-600); grid-column: 1/-1;">Chưa có sản phẩm yêu thích</div>';
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

  window.removeWishlistItem = async (productId) => {
    try {
      const data = await fetchAPI(`/api/users/wishlist/${productId}`, { method: 'DELETE' });
      if (data.success) {
        showToast('Đã xóa bánh khỏi danh sách yêu thích!', 'success');
        loadWishlist();
      }
    } catch (e) {}
  };

  // ================= MODAL: REVIEW SUBMIT =================
  let activeReviewOrderId = '';
  let activeReviewProductId = '';

  window.openReviewModal = (orderId, productId) => {
    activeReviewOrderId = orderId;
    activeReviewProductId = productId;

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
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" onclick="editTeaBreakRequest('${req._id}')">Chỉnh sửa</button>
              <button class="btn btn-primary" onclick="acceptTeaBreakQuote('${req._id}')">Chấp nhận & Đặt tiệc</button>
            </div>
          </div>
        `;
      } else if (['pending', 'received', 'consulting'].includes(req.status)) {
        actionHTML = `
          <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="color: var(--gray-600); font-style: italic; font-size: 14px;">Đang chờ nhân viên liên hệ tư vấn và báo giá...</div>
            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" onclick="editTeaBreakRequest('${req._id}')">Chỉnh sửa</button>
          </div>
        `;
      } else if (req.status === 'confirmed') {
        actionHTML = `<div style="margin-top: 12px; color: var(--success); font-weight: 700; font-size: 14px;">✓ Yêu cầu đã được xác nhận & chuyển thành đơn hàng!</div>`;
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
    showPromptModal('Vui lòng điền địa chỉ giao nhận & setup tiệc:', '', async (address) => {
      if (!address || !address.trim()) {
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
    });
  };

  // Edit Tea Break Request Logic
  window.editTeaBreakRequest = async (reqId) => {
    try {
      const data = await fetchAPI(`/api/teabreak-requests/${reqId}`);
      if (data.success && data.request) {
        const req = data.request;
        document.getElementById('edit-teabreak-id').value = req._id;
        document.getElementById('edit-tb-fullname').value = req.fullname;
        document.getElementById('edit-tb-phone').value = req.phone;
        document.getElementById('edit-tb-email').value = req.email;
        document.getElementById('edit-tb-corporate').value = req.corporateName || '';
        document.getElementById('edit-tb-package').value = req.packageType;
        document.getElementById('edit-tb-groupsize').value = req.groupSize;
        document.getElementById('edit-tb-tea').value = req.teaOption;
        document.getElementById('edit-tb-theme').value = req.eventTheme || '';
        
        if (req.expectedDate) {
          const d = new Date(req.expectedDate);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          document.getElementById('edit-tb-date').value = `${yyyy}-${mm}-${dd}`;
        }
        document.getElementById('edit-tb-time').value = req.expectedTime || '14:00';
        document.getElementById('edit-tb-note').value = req.note || '';

        document.getElementById('edit-teabreak-modal').classList.add('active');
      }
    } catch (e) {}
  };

  window.closeEditTeaBreakModal = () => {
    document.getElementById('edit-teabreak-modal').classList.remove('active');
  };

  const teabreakEditForm = document.getElementById('teabreak-edit-form');
  if (teabreakEditForm) {
    teabreakEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const reqId = document.getElementById('edit-teabreak-id').value;
      const fullname = document.getElementById('edit-tb-fullname').value.trim();
      const phone = document.getElementById('edit-tb-phone').value.trim();
      const email = document.getElementById('edit-tb-email').value.trim();
      const corporateName = document.getElementById('edit-tb-corporate').value.trim();
      const packageType = document.getElementById('edit-tb-package').value;
      const groupSize = document.getElementById('edit-tb-groupsize').value;
      const teaOption = document.getElementById('edit-tb-tea').value;
      const eventTheme = document.getElementById('edit-tb-theme').value.trim();
      const expectedDate = document.getElementById('edit-tb-date').value;
      const expectedTime = document.getElementById('edit-tb-time').value;
      const note = document.getElementById('edit-tb-note').value.trim();
      const fileInput = document.getElementById('edit-tb-layout');

      const phoneInput = document.getElementById('edit-tb-phone');
      hideFieldError(phoneInput);
      const phoneRegex = /^0\d{8}$|^0\d{10}$/;
      if (phone && !phoneRegex.test(phone)) {
        showFieldError(phoneInput, 'Số điện thoại bắt đầu bằng số 0, gồm 9 hoặc 11 chữ số');
        return;
      }

      const formData = new FormData();
      formData.append('fullname', fullname);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('corporateName', corporateName);
      formData.append('packageType', packageType);
      formData.append('groupSize', groupSize);
      formData.append('teaOption', teaOption);
      formData.append('eventTheme', eventTheme);
      formData.append('expectedDate', expectedDate);
      formData.append('expectedTime', expectedTime);
      formData.append('note', note);
      
      if (fileInput.files.length > 0) {
        formData.append('sampleLayout', fileInput.files[0]);
      }

      try {
        const data = await fetchAPI(`/api/teabreak-requests/${reqId}`, {
          method: 'PUT',
          body: formData,
        });

        if (data.success) {
          showToast(data.message, 'success');
          closeEditTeaBreakModal();
          loadTeaBreakRequests();
        }
      } catch (err) {}
    });
  }

  // Sync tab from URL query parameter at the very end of DOMContentLoaded to ensure all tab loaders are initialized
  const urlParams = new URLSearchParams(window.location.search);
  const targetTab = urlParams.get('tab');
  if (targetTab && ['tab-profile', 'tab-orders', 'tab-addresses', 'tab-wishlist', 'tab-teabreak'].includes(targetTab)) {
    switchTab(targetTab);
  } else {
    switchTab('tab-profile');
  }
});
