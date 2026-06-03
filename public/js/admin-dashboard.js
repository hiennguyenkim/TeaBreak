// Admin Dashboard Script
document.addEventListener('DOMContentLoaded', async () => {
  const adminContainer = document.getElementById('admin-dashboard-container');
  if (!adminContainer) return;

  // Security check: Redirect guest and unauthorized users
  try {
    const data = await fetchAPI('/api/auth/me', { silent: true });
    if (!data.success || data.user.role !== 'admin') {
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

    if (nameEl) nameEl.textContent = user.name || 'Quản trị viên';
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
    if (tabId === 'tab-stats') {
      loadAdminSummary();
      loadAdminAnalytics();
    }
    if (tabId === 'tab-products') loadAdminProducts();
    if (tabId === 'tab-categories') loadAdminCategories();
    if (tabId === 'tab-accounts') loadAdminAccounts();
    if (tabId === 'tab-coupons') loadAdminCoupons();
    if (tabId === 'tab-reviews') loadAdminReviews();
    if (tabId === 'tab-messages') loadMessagesWorkspace();
    if (tabId === 'tab-settings') loadAdminSettings();
  };

  tabMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.dataset.tab);
    });
  });

  // ================= TAB: SUMMARY =================
  const loadAdminSummary = async () => {
    try {
      const data = await fetchAPI('/api/dashboard/admin');
      if (data.success) {
        document.getElementById('stat-total-products').textContent = data.stats.totalProducts;
        document.getElementById('stat-total-categories').textContent = data.stats.totalCategories;
        document.getElementById('stat-total-orders').textContent = data.stats.totalOrders;
        document.getElementById('stat-total-customers').textContent = data.stats.totalCustomers;
        document.getElementById('stat-total-staff').textContent = data.stats.totalStaff;
        document.getElementById('stat-today-revenue').textContent = data.stats.todayRevenue.toLocaleString() + 'đ';
        document.getElementById('stat-month-revenue').textContent = data.stats.thisMonthRevenue.toLocaleString() + 'đ';

        // Render best sellers list
        const bestList = document.getElementById('bestsellers-list');
        if (bestList) {
          if (data.bestSellers.length === 0) {
            bestList.innerHTML = '<div style="color: var(--gray-600); font-style: italic;">Chưa có dữ liệu bán hàng.</div>';
          } else {
            bestList.innerHTML = data.bestSellers.map(bs => `
              <div class="bestseller-item">
                <div>
                  <div class="bs-name">${bs.name}</div>
                  <div class="bs-stats">Đã bán: <strong>${bs.soldQuantity} cái</strong></div>
                </div>
                <div class="bs-amount">${bs.totalSales.toLocaleString()}đ</div>
              </div>
            `).join('');
          }
        }
      }
    } catch (e) {}
  };

  // ================= TAB: PRODUCTS (CRUD) =================
  let categoriesCache = [];

  const loadAdminProducts = async () => {
    const tableBody = document.getElementById('admin-products-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Đang tải sản phẩm...</td></tr>';

    try {
      // Warm category cache once
      if (categoriesCache.length === 0) {
        const catRes = await fetchAPI('/api/categories');
        if (catRes.success) categoriesCache = catRes.categories;
      }

      const data = await fetchAPI('/api/products?limit=100');
      if (data.success) {
        renderAdminProducts(data.products);
      }
    } catch (e) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center" style="color: var(--danger);">Không thể tải sản phẩm.</td></tr>';
    }
  };

  const renderAdminProducts = (products) => {
    const tableBody = document.getElementById('admin-products-table-body');
    if (products.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có sản phẩm nào.</td></tr>';
      return;
    }

    tableBody.innerHTML = products.map(p => `
      <tr>
        <td><strong>${p.code}</strong></td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${p.images[0] || '/public/img/placeholder.jpg'}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
            <strong style="font-size: 13px;">${p.name}</strong>
          </div>
        </td>
        <td>${p.categoryId?.name || 'Bánh Ngọt'}</td>
        <td>${p.price.toLocaleString()}đ</td>
        <td>${p.stock}</td>
        <td>
          <div class="actions-row">
            <button class="table-btn primary" onclick="openProductModal('${p._id}')">Sửa</button>
            <button class="table-btn danger" onclick="deleteAdminProduct('${p._id}')">Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  // Open Product Modal Add/Edit
  let activeProductId = '';

  window.openProductModal = async (productId = '') => {
    activeProductId = productId;
    const modal = document.getElementById('product-crud-modal');
    const form = document.getElementById('product-crud-form');
    const title = document.getElementById('product-modal-title');

    if (!modal || !form || !title) return;

    // Load category options
    const catSelect = document.getElementById('p-category');
    catSelect.innerHTML = categoriesCache.map(c => `<option value="${c._id}">${c.name}</option>`).join('');

    if (productId) {
      title.textContent = 'Cập Nhật Thông Tin Bánh';
      try {
        const data = await fetchAPI(`/api/products/${productId}`);
        if (data.success && data.product) {
          const p = data.product;
          document.getElementById('p-name').value = p.name || '';
          document.getElementById('p-code').value = p.code || '';
          document.getElementById('p-category').value = p.categoryId?._id || p.categoryId || '';
          document.getElementById('p-price').value = p.price || 0;
          document.getElementById('p-oldprice').value = p.oldPrice || '';
          document.getElementById('p-discountprice').value = p.discountPrice || '';
          document.getElementById('p-stock').value = p.stock || 0;
          document.getElementById('p-status').value = p.status || 'available';
          document.getElementById('p-flavors').value = p.flavor.join(', ') || '';
          document.getElementById('p-sizes').value = p.size.join(', ') || '';
          document.getElementById('p-weight').value = p.weight || '';
          document.getElementById('p-serving').value = p.serving || '';
          document.getElementById('p-ingredients').value = p.ingredients || '';
          document.getElementById('p-desc').value = p.description || '';
          document.getElementById('p-featured').checked = !!p.isFeatured;
          document.getElementById('p-bestseller').checked = !!p.isBestSeller;
          document.getElementById('p-seasonal').checked = !!p.isSeasonal;
        }
      } catch (e) {}
    } else {
      title.textContent = 'Thêm Bánh Mới';
      form.reset();
    }

    modal.classList.add('active');
  };

  window.closeProductModal = () => {
    const modal = document.getElementById('product-crud-modal');
    if (modal) modal.classList.remove('active');
  };

  // Submit product CRUD
  const productCrudForm = document.getElementById('product-crud-form');
  if (productCrudForm) {
    productCrudForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData();
      formData.append('name', document.getElementById('p-name').value.trim());
      formData.append('code', document.getElementById('p-code').value.trim());
      formData.append('categoryId', document.getElementById('p-category').value);
      formData.append('price', document.getElementById('p-price').value);
      formData.append('oldPrice', document.getElementById('p-oldprice').value);
      formData.append('discountPrice', document.getElementById('p-discountprice').value);
      formData.append('stock', document.getElementById('p-stock').value);
      formData.append('status', document.getElementById('p-status').value);
      formData.append('flavor', document.getElementById('p-flavors').value);
      formData.append('size', document.getElementById('p-sizes').value);
      formData.append('weight', document.getElementById('p-weight').value);
      formData.append('serving', document.getElementById('p-serving').value);
      formData.append('ingredients', document.getElementById('p-ingredients').value);
      formData.append('description', document.getElementById('p-desc').value);
      formData.append('isFeatured', document.getElementById('p-featured').checked);
      formData.append('isBestSeller', document.getElementById('p-bestseller').checked);
      formData.append('isSeasonal', document.getElementById('p-seasonal').checked);

      const fileInput = document.getElementById('p-images');
      if (fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
          formData.append('images', fileInput.files[i]);
        }
      }

      let url = '/api/products';
      let method = 'POST';
      if (activeProductId) {
        url = `/api/products/${activeProductId}`;
        method = 'PUT';
      }

      try {
        const data = await fetchAPI(url, {
          method,
          body: formData,
        });

        if (data.success) {
          showToast(data.message, 'success');
          closeProductModal();
          loadAdminProducts();
        }
      } catch (err) {}
    });
  }

  window.deleteAdminProduct = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này khỏi tiệm bánh không?')) return;

    try {
      const data = await fetchAPI(`/api/products/${id}`, { method: 'DELETE' });
      if (data.success) {
        showToast(data.message, 'success');
        loadAdminProducts();
      }
    } catch (e) {}
  };

  // ================= TAB: CATEGORIES =================
  const loadAdminCategories = async () => {
    const tableBody = document.getElementById('admin-categories-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Đang tải danh mục...</td></tr>';

    try {
      const data = await fetchAPI('/api/categories');
      if (data.success) {
        renderAdminCategories(data.categories);
      }
    } catch (e) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: var(--danger);">Không thể tải danh mục.</td></tr>';
    }
  };

  const renderAdminCategories = (categories) => {
    const tableBody = document.getElementById('admin-categories-table-body');
    if (categories.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có danh mục nào.</td></tr>';
      return;
    }

    tableBody.innerHTML = categories.map(c => `
      <tr>
        <td>
          <img src="${c.image || '/public/img/placeholder.jpg'}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
        </td>
        <td><strong>${c.name}</strong></td>
        <td><code>${c.slug}</code></td>
        <td>${c.sortOrder}</td>
        <td style="font-size: 13px; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.description || ''}</td>
        <td>
          <span class="status-indicator">
            <span class="status-dot ${c.status === 'active' ? 'active' : 'blocked'}"></span>
            ${c.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
          </span>
        </td>
        <td>
          <div class="actions-row">
            <button class="table-btn primary" onclick="openCategoryModal('${c._id}')">Sửa</button>
            <button class="table-btn danger" onclick="deleteAdminCategory('${c._id}')">Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  let activeCategoryId = '';

  window.openCategoryModal = async (catId = '') => {
    activeCategoryId = catId;
    const modal = document.getElementById('category-crud-modal');
    const form = document.getElementById('category-crud-form');
    const title = document.getElementById('category-modal-title');

    if (!modal || !form || !title) return;

    form.reset();

    if (catId) {
      title.textContent = 'Cập Nhật Danh Mục';
      try {
        const data = await fetchAPI(`/api/categories/${catId}`);
        if (data.success && data.category) {
          const c = data.category;
          document.getElementById('cat-name').value = c.name || '';
          document.getElementById('cat-slug').value = c.slug || '';
          document.getElementById('cat-sort').value = c.sortOrder || 0;
          document.getElementById('cat-status').value = c.status || 'active';
          document.getElementById('cat-desc').value = c.description || '';
        }
      } catch (e) {}
    } else {
      title.textContent = 'Thêm Danh Mục Mới';
      document.getElementById('cat-sort').value = 0;
      document.getElementById('cat-status').value = 'active';
    }

    modal.classList.add('active');
  };

  window.closeCategoryModal = () => {
    const modal = document.getElementById('category-crud-modal');
    if (modal) modal.classList.remove('active');
  };

  const categoryCrudForm = document.getElementById('category-crud-form');
  if (categoryCrudForm) {
    categoryCrudForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('cat-name').value.trim();
      const slug = document.getElementById('cat-slug').value.trim();
      const sortOrder = document.getElementById('cat-sort').value;
      const status = document.getElementById('cat-status').value;
      const description = document.getElementById('cat-desc').value.trim();
      const fileInput = document.getElementById('cat-image');

      const formData = new FormData();
      formData.append('name', name);
      if (slug) formData.append('slug', slug);
      formData.append('sortOrder', sortOrder);
      formData.append('status', status);
      formData.append('description', description);

      if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
      }

      let url = '/api/categories';
      let method = 'POST';
      if (activeCategoryId) {
        url = `/api/categories/${activeCategoryId}`;
        method = 'PUT';
      }

      try {
        const data = await fetchAPI(url, {
          method,
          body: formData,
        });
        if (data.success) {
          showToast(data.message, 'success');
          closeCategoryModal();
          loadAdminCategories();
          // Update cached categories
          const catRes = await fetchAPI('/api/categories');
          if (catRes.success) categoriesCache = catRes.categories;
        }
      } catch (err) {}
    });
  }

  window.deleteAdminCategory = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

    try {
      const data = await fetchAPI(`/api/categories/${id}`, { method: 'DELETE' });
      if (data.success) {
        showToast(data.message, 'success');
        loadAdminCategories();
        // Update cached categories
        const catRes = await fetchAPI('/api/categories');
        if (catRes.success) categoriesCache = catRes.categories;
      }
    } catch (e) {}
  };

  // ================= TAB: ACCOUNTS MANAGEMENT =================
  const loadAdminAccounts = async () => {
    const tableBody = document.getElementById('admin-accounts-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Đang tải tài khoản...</td></tr>';

    try {
      const data = await fetchAPI('/api/users');
      if (data.success) {
        renderAdminAccounts(data.users);
      }
    } catch (e) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: var(--danger);">Lỗi nạp danh sách tài khoản.</td></tr>';
    }
  };

  const renderAdminAccounts = (users) => {
    const tableBody = document.getElementById('admin-accounts-table-body');
    if (users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Không tìm thấy tài khoản nào.</td></tr>';
      return;
    }

    tableBody.innerHTML = users.map(u => {
      const roleBadge = u.role === 'admin' ? '<span class="badge" style="background-color: var(--primary-light); color: var(--primary-hover); font-weight: bold;">Admin</span>' :
                         u.role === 'staff' ? '<span class="badge" style="background-color: #e3f2fd; color: #1e88e5;">Staff</span>' :
                         '<span class="badge" style="background-color: #f1f1f1; color: #666;">Khách hàng</span>';
      
      const statusText = u.status === 'active' ? 'Hoạt động' : 'Đã khóa';
      const statusClass = u.status === 'active' ? 'active' : 'blocked';

      let avatarHtml = '👤';
      if (u.avatar) {
        avatarHtml = `<img src="${u.avatar}" alt="Avatar" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 8px; border: 1px solid var(--primary-light);">`;
      } else {
        let fallbackEmoji = '👤';
        if (u.role === 'admin') fallbackEmoji = '👑';
        else if (u.role === 'staff') fallbackEmoji = '👩‍🍳';
        avatarHtml = `<span style="font-size: 16px; margin-right: 8px; vertical-align: middle; display: inline-block; width: 28px; text-align: center;">${fallbackEmoji}</span>`;
      }

      return `
        <tr>
          <td style="display: flex; align-items: center; min-height: 48px;">
            ${avatarHtml}
            <strong>${u.name}</strong>
          </td>
          <td><code>${u.email}</code></td>
          <td>${u.phone}</td>
          <td>${roleBadge}</td>
          <td>
            <span class="status-indicator">
              <span class="status-dot ${statusClass}"></span>
              ${statusText}
            </span>
          </td>
          <td style="font-size: 13px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${u.address || ''}">${u.address || ''}</td>
          <td>
            <div class="actions-row">
              <button class="table-btn primary" onclick="openAccountModal('${u._id}')">Sửa</button>
              <button class="table-btn danger" onclick="deleteAdminAccount('${u._id}')">Xóa</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  };

  let activeAccountId = '';

  // Handle instant account modal avatar preview
  const accAvatarFileInput = document.getElementById('acc-avatar-file');
  if (accAvatarFileInput) {
    accAvatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const previewImg = document.getElementById('acc-avatar-preview');
        const placeholderEl = document.getElementById('acc-avatar-placeholder');
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

  window.openAccountModal = async (userId = '') => {
    activeAccountId = userId;
    const modal = document.getElementById('account-crud-modal');
    const form = document.getElementById('account-crud-form');
    const title = document.getElementById('account-modal-title');
    const passwordLabel = document.getElementById('acc-password-label');
    const passwordInput = document.getElementById('acc-password');
    const previewImg = document.getElementById('acc-avatar-preview');
    const placeholderEl = document.getElementById('acc-avatar-placeholder');
    const fileInput = document.getElementById('acc-avatar-file');

    if (!modal || !form || !title) return;

    form.reset();
    if (fileInput) fileInput.value = '';

    if (previewImg && placeholderEl) {
      previewImg.src = '';
      previewImg.style.display = 'none';
      placeholderEl.style.display = 'flex';
    }

    if (userId) {
      title.textContent = 'Cập Nhật Tài Khoản';
      passwordLabel.textContent = 'Mật khẩu mới (Bỏ trống nếu không đổi):';
      passwordInput.removeAttribute('required');
      
      try {
        const res = await fetchAPI('/api/users');
        if (res.success) {
          const u = res.users.find(x => x._id === userId);
          if (u) {
            document.getElementById('acc-name').value = u.name || '';
            document.getElementById('acc-email').value = u.email || '';
            document.getElementById('acc-phone').value = u.phone || '';
            document.getElementById('acc-role').value = u.role || 'user';
            document.getElementById('acc-status').value = u.status || 'active';
            document.getElementById('acc-address').value = u.address || '';
            if (u.avatar && previewImg && placeholderEl) {
              previewImg.src = u.avatar;
              previewImg.style.display = 'block';
              placeholderEl.style.display = 'none';
            }
          }
        }
      } catch (e) {}
    } else {
      title.textContent = 'Thêm Tài Khoản Mới';
      passwordLabel.textContent = 'Mật khẩu khởi tạo:';
      passwordInput.setAttribute('required', 'required');
      document.getElementById('acc-role').value = 'user';
      document.getElementById('acc-status').value = 'active';
    }

    modal.classList.add('active');
  };

  window.closeAccountModal = () => {
    const modal = document.getElementById('account-crud-modal');
    if (modal) modal.classList.remove('active');
  };

  const accountCrudForm = document.getElementById('account-crud-form');
  if (accountCrudForm) {
    accountCrudForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('acc-name').value.trim();
      const email = document.getElementById('acc-email').value.trim();
      const phone = document.getElementById('acc-phone').value.trim();
      const password = document.getElementById('acc-password').value;
      const role = document.getElementById('acc-role').value;
      const status = document.getElementById('acc-status').value;
      const address = document.getElementById('acc-address').value.trim();
      const fileInput = document.getElementById('acc-avatar-file');

      if (!name) {
        showToast('Họ tên không được bỏ trống!', 'warning');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Địa chỉ Email không đúng định dạng (ví dụ: name@domain.com)!', 'warning');
        return;
      }

      const phoneRegex = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
        showToast('Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0988888888)!', 'warning');
        return;
      }

      if (!activeAccountId) {
        if (!password || password.length < 6) {
          showToast('Mật khẩu khởi tạo phải chứa ít nhất 6 ký tự!', 'warning');
          return;
        }
      } else {
        if (password && password.length < 6) {
          showToast('Mật khẩu mới phải chứa ít nhất 6 ký tự!', 'warning');
          return;
        }
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('role', role);
      formData.append('status', status);
      formData.append('address', address);
      if (password) {
        formData.append('password', password);
      }
      if (fileInput && fileInput.files.length > 0) {
        formData.append('avatarFile', fileInput.files[0]);
      }

      let url = '/api/users';
      let method = 'POST';
      if (activeAccountId) {
        url = `/api/users/${activeAccountId}`;
        method = 'PUT';
      }

      try {
        const data = await fetchAPI(url, {
          method,
          body: formData,
        });
        if (data.success) {
          showToast(data.message, 'success');
          closeAccountModal();
          loadAdminAccounts();
        }
      } catch (err) {}
    });
  }

  window.deleteAdminAccount = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản người dùng này không?')) return;

    try {
      const data = await fetchAPI(`/api/users/${id}`, { method: 'DELETE' });
      if (data.success) {
        showToast(data.message, 'success');
        loadAdminAccounts();
      }
    } catch (e) {}
  };

  // ================= TAB: COUPONS (PROMOTIONS) =================
  const loadAdminCoupons = async () => {
    const tableBody = document.getElementById('admin-coupons-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Đang tải mã giảm giá...</td></tr>';

    try {
      const data = await fetchAPI('/api/promotions');
      if (data.success) {
        renderAdminCoupons(data.promotions);
      }
    } catch (e) {
      tableBody.innerHTML = '<tr><td colspan="9" class="text-center" style="color: var(--danger);">Lỗi tải mã giảm giá.</td></tr>';
    }
  };

  const renderAdminCoupons = (promotions) => {
    const tableBody = document.getElementById('admin-coupons-table-body');
    if (promotions.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Chưa có mã giảm giá nào.</td></tr>';
      return;
    }

    tableBody.innerHTML = promotions.map(c => {
      const discountText = c.discountType === 'percentage' ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}đ`;
      const dateRangeText = `${new Date(c.startDate).toLocaleDateString('vi-VN')}<br>${new Date(c.expiryDate).toLocaleDateString('vi-VN')}`;
      
      return `
        <tr>
          <td><strong style="color: var(--primary-hover); font-size: 14px;">${c.code}</strong></td>
          <td><strong>${c.name}</strong></td>
          <td>${c.discountType === 'percentage' ? 'Phần trăm' : 'Cố định'}</td>
          <td>${discountText}</td>
          <td>${c.minOrderAmount.toLocaleString()}đ</td>
          <td><strong>${c.usedCount}</strong> / ${c.usageLimit}</td>
          <td style="font-size: 12px; line-height: 1.3;">${dateRangeText}</td>
          <td>
            <span class="status-indicator">
              <span class="status-dot ${c.status === 'active' ? 'active' : 'blocked'}"></span>
              ${c.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
            </span>
          </td>
          <td>
            <div class="actions-row">
              <button class="table-btn primary" onclick="openCouponModal('${c._id}')">Sửa</button>
              <button class="table-btn danger" onclick="deleteAdminCoupon('${c._id}')">Xóa</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  };

  let activeCouponId = '';

  window.openCouponModal = async (couponId = '') => {
    activeCouponId = couponId;
    const modal = document.getElementById('coupon-crud-modal');
    const form = document.getElementById('coupon-crud-form');
    const title = document.getElementById('coupon-modal-title');

    if (!modal || !form || !title) return;

    form.reset();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('coupon-start').value = today;
    document.getElementById('coupon-expiry').value = today;

    if (couponId) {
      title.textContent = 'Cập Nhật Mã Giảm Giá';
      try {
        const data = await fetchAPI('/api/promotions');
        if (data.success) {
          const c = data.promotions.find(x => x._id === couponId);
          if (c) {
            document.getElementById('coupon-code').value = c.code || '';
            document.getElementById('coupon-name').value = c.name || '';
            document.getElementById('coupon-type').value = c.discountType || 'percentage';
            document.getElementById('coupon-value').value = c.discountValue || '';
            document.getElementById('coupon-min').value = c.minOrderAmount || 0;
            document.getElementById('coupon-limit').value = c.usageLimit || 100;
            document.getElementById('coupon-start').value = c.startDate.split('T')[0];
            document.getElementById('coupon-expiry').value = c.expiryDate.split('T')[0];
            document.getElementById('coupon-status').value = c.status || 'active';
          }
        }
      } catch (e) {}
    } else {
      title.textContent = 'Thêm Mã Giảm Giá Mới';
      document.getElementById('coupon-type').value = 'percentage';
      document.getElementById('coupon-min').value = 0;
      document.getElementById('coupon-limit').value = 100;
      document.getElementById('coupon-status').value = 'active';
    }

    modal.classList.add('active');
  };

  window.closeCouponModal = () => {
    const modal = document.getElementById('coupon-crud-modal');
    if (modal) modal.classList.remove('active');
  };

  const couponCrudForm = document.getElementById('coupon-crud-form');
  if (couponCrudForm) {
    couponCrudForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const code = document.getElementById('coupon-code').value.trim().toUpperCase();
      const name = document.getElementById('coupon-name').value.trim();
      const discountType = document.getElementById('coupon-type').value;
      const discountValue = document.getElementById('coupon-value').value;
      const minOrderAmount = document.getElementById('coupon-min').value;
      const usageLimit = document.getElementById('coupon-limit').value;
      const startDate = document.getElementById('coupon-start').value;
      const expiryDate = document.getElementById('coupon-expiry').value;
      const status = document.getElementById('coupon-status').value;

      const payload = { code, name, discountType, discountValue, minOrderAmount, usageLimit, startDate, expiryDate, status };

      let url = '/api/promotions';
      let method = 'POST';
      if (activeCouponId) {
        url = `/api/promotions/${activeCouponId}`;
        method = 'PUT';
      }

      try {
        const data = await fetchAPI(url, {
          method,
          body: JSON.stringify(payload),
        });
        if (data.success) {
          showToast(data.message, 'success');
          closeCouponModal();
          loadAdminCoupons();
        }
      } catch (err) {}
    });
  }

  window.deleteAdminCoupon = async (id) => {
    if (!confirm('Bạn có muốn xóa mã giảm giá này?')) return;

    try {
      const data = await fetchAPI(`/api/promotions/${id}`, { method: 'DELETE' });
      if (data.success) {
        showToast(data.message, 'success');
        loadAdminCoupons();
      }
    } catch (e) {}
  };

  // ================= TAB: REVIEWS MODERATION =================
  const loadAdminReviews = async () => {
    const listEl = document.getElementById('reviews-moderation-list');
    if (!listEl) return;

    listEl.innerHTML = '<div class="text-center">Đang tải danh sách đánh giá...</div>';

    try {
      const data = await fetchAPI('/api/reviews');
      if (data.success) {
        renderAdminReviews(data.reviews);
      }
    } catch (e) {
      listEl.innerHTML = '<div class="text-center" style="color: var(--danger);">Không thể tải đánh giá.</div>';
    }
  };

  const renderAdminReviews = (reviews) => {
    const listEl = document.getElementById('reviews-moderation-list');
    if (reviews.length === 0) {
      listEl.innerHTML = '<div class="text-center" style="padding: 24px; color: var(--gray-600);">Chưa có đánh giá nào được gửi lên.</div>';
      return;
    }

    listEl.innerHTML = reviews.map(r => {
      const date = new Date(r.createdAt).toLocaleDateString('vi-VN');
      const stars = '⭐'.repeat(r.rating);
      
      const photoHTML = r.images.map(img => `
        <img src="${img}" style="width: 50px; height: 50px; border-radius: 4px; object-fit: cover; cursor: pointer; border: 1px solid var(--gray-200);" onclick="window.open('${img}')">
      `).join('');

      return `
        <div class="order-history-card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${r.userId?.name || 'Khách Vãng Lai'}</strong> đánh giá bánh <strong>${r.productId?.name || 'Bánh Ngọt'}</strong>
              <div style="color: var(--warning); font-size: 14px; margin-top: 4px;">${stars} <span style="font-size: 12px; color: var(--gray-600); margin-left: 8px;">Trạng thái: <strong>${r.status.toUpperCase()}</strong></span></div>
            </div>
            <span class="text-muted" style="font-size: 12px;">Ngày gửi: ${date}</span>
          </div>
          
          <div style="font-size: 14px; background-color: var(--secondary); padding: 12px; border-radius: var(--radius-sm); margin: 10px 0;">
            "${r.content}"
          </div>

          ${r.images.length > 0 ? `<div style="display: flex; gap: 8px; margin-bottom: 12px;">${photoHTML}</div>` : ''}

          <!-- Admin reply block -->
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 12px;">Phản hồi từ tiệm bánh:</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="review-reply-input-${r._id}" class="form-control" style="padding: 8px 12px; font-size: 13px;" placeholder="Cảm ơn bạn đã phản hồi..." value="${r.reply || ''}">
              <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px;" onclick="sendReviewReply('${r._id}')">Lưu phản hồi</button>
            </div>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px dashed var(--gray-200); padding-top: 12px; margin-top: 12px;">
            <button class="table-btn success" onclick="moderateReviewState('${r._id}', 'approved')">Phê Duyệt</button>
            <button class="table-btn primary" onclick="moderateReviewState('${r._id}', 'hidden')">Tạm Ẩn</button>
            <button class="table-btn danger" onclick="deleteAdminReview('${r._id}')">Xóa</button>
          </div>
        </div>
      `;
    }).join('');
  };

  window.moderateReviewState = async (reviewId, status) => {
    try {
      const data = await fetchAPI(`/api/reviews/${reviewId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (data.success) {
        showToast(data.message, 'success');
        loadAdminReviews();
      }
    } catch (e) {}
  };

  window.sendReviewReply = async (reviewId) => {
    const replyVal = document.getElementById(`review-reply-input-${reviewId}`).value.trim();
    if (!replyVal) {
      showToast('Vui lòng nhập nội dung phản hồi trước khi lưu', 'warning');
      return;
    }

    try {
      const data = await fetchAPI(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyVal }),
      });
      if (data.success) {
        showToast(data.message, 'success');
        loadAdminReviews();
      }
    } catch (e) {}
  };

  window.deleteAdminReview = async (reviewId) => {
    if (!confirm('Bạn có muốn xóa vĩnh viễn đánh giá này không?')) return;

    try {
      const data = await fetchAPI(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      if (data.success) {
        showToast(data.message, 'success');
        loadAdminReviews();
      }
    } catch (e) {}
  };

  // ================= TAB: ANALYTICS & CHARTS =================
  let currentAnalyticsRange = '7days';

  window.setAnalyticsRange = (range) => {
    currentAnalyticsRange = range;
    document.querySelectorAll('#tab-stats .filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadAdminAnalytics();
  };

  const loadAdminAnalytics = async () => {
    const chartViewport = document.getElementById('revenue-chart-viewport');
    if (!chartViewport) return;

    chartViewport.innerHTML = '<div style="margin: auto; color: var(--primary-hover); font-weight: 600;">Đang nạp báo cáo doanh thu...</div>';

    try {
      const data = await fetchAPI(`/api/dashboard/revenue-report?range=${currentAnalyticsRange}`);
      if (data.success) {
        renderRevenueChart(data.report);
      }
    } catch (e) {
      chartViewport.innerHTML = '<div style="margin: auto; color: var(--danger);">Không thể vẽ biểu đồ báo cáo.</div>';
    }
  };

  const renderRevenueChart = (report) => {
    const chartViewport = document.getElementById('revenue-chart-viewport');
    if (report.values.length === 0) {
      chartViewport.innerHTML = '<div style="margin: auto; color: var(--gray-600);">Chưa có doanh thu nào được ghi nhận trong thời gian này.</div>';
      return;
    }

    // Determine max value to scale chart columns
    const maxVal = Math.max(...report.values) || 100000;

    chartViewport.innerHTML = report.values.map((val, idx) => {
      const percent = (val / maxVal) * 80; // max height is 80%
      const label = report.labels[idx];
      const orders = report.orderCounts[idx];

      return `
        <div class="chart-bar-col">
          <div class="chart-bar" style="height: ${percent}%;">
            <div class="chart-bar-tooltip">
              Doanh thu: ${val.toLocaleString()}đ<br>
              Số đơn: ${orders} đơn
            </div>
          </div>
          <span class="chart-bar-label">${label}</span>
        </div>
      `;
    }).join('');
  };

  // ================= TAB: SETTINGS =================
  const loadAdminSettings = async () => {
    try {
      const data = await fetchAPI('/api/settings');
      if (data.success && data.settings) {
        const settings = data.settings;
        document.getElementById('setting-logo-text').value = settings.logoText || '';
        document.getElementById('setting-logo-icon').value = settings.logoIcon || '';
        document.getElementById('setting-footer-desc').value = settings.footerDesc || '';
        document.getElementById('setting-social-fb').value = settings.socialFb || '';
        document.getElementById('setting-social-insta').value = settings.socialInsta || '';
        document.getElementById('setting-social-youtube').value = settings.socialYoutube || '';
        document.getElementById('setting-address').value = settings.address || '';
        document.getElementById('setting-phone').value = settings.phone || '';
        document.getElementById('setting-email').value = settings.email || '';
        document.getElementById('setting-opening-hours').value = settings.openingHours || '';
        document.getElementById('setting-map-embed').value = settings.mapEmbed || '';
      }
    } catch (e) {
      showToast('Không thể tải cấu hình cài đặt.', 'danger');
    }
  };

  const settingsForm = document.getElementById('admin-settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData();
        formData.append('logoText', document.getElementById('setting-logo-text').value);
        formData.append('logoIcon', document.getElementById('setting-logo-icon').value);
        formData.append('footerDesc', document.getElementById('setting-footer-desc').value);
        formData.append('socialFb', document.getElementById('setting-social-fb').value);
        formData.append('socialInsta', document.getElementById('setting-social-insta').value);
        formData.append('socialYoutube', document.getElementById('setting-social-youtube').value);
        formData.append('address', document.getElementById('setting-address').value);
        formData.append('phone', document.getElementById('setting-phone').value);
        formData.append('email', document.getElementById('setting-email').value);
        formData.append('openingHours', document.getElementById('setting-opening-hours').value);
        formData.append('mapEmbed', document.getElementById('setting-map-embed').value);

        const logoFileInput = document.getElementById('setting-logo-file');
        if (logoFileInput && logoFileInput.files[0]) {
          formData.append('logoFile', logoFileInput.files[0]);
        }

        const res = await fetchAPI('/api/settings', {
          method: 'PUT',
          body: formData
        });

        if (res.success) {
          showToast(res.message, 'success');
          if (logoFileInput) logoFileInput.value = '';
          if (res.settings && res.settings.logoIcon) {
            document.getElementById('setting-logo-icon').value = res.settings.logoIcon;
          }
          // Reload global settings dynamically on dashboard immediately
          if (typeof loadGlobalSettings === 'function') {
            loadGlobalSettings();
          }
        }
      } catch (err) {
        // fetchAPI handles showToast for errors by default
      }
    });
  }

  // ================= TAB: SUPPORT MESSAGES & CONTACTS WORKSPACE =================
  let activeChatUserId = '';

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

    messagesBox.scrollTop = messagesBox.scrollHeight;
  };

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

  // ================= TAB: CONTACTS & FEEDBACK TICKETS (MESSENGER STYLE) =================
  let activeContactId = '';
  let contactTicketsList = [];

  const loadContactTickets = async () => {
    const listEl = document.getElementById('contacts-users-list');
    if (!listEl) return;

    listEl.innerHTML = '<div style="padding: 10px; color: var(--gray-600);">Đang tải yêu cầu...</div>';

    try {
      const data = await fetchAPI('/api/contacts');
      if (data.success) {
        contactTicketsList = data.contacts;
        renderContactsList();
      }
    } catch (e) {
      listEl.innerHTML = '<div style="color: var(--danger); padding: 10px;">Lỗi tải dữ liệu.</div>';
    }
  };

  const renderContactsList = () => {
    const listEl = document.getElementById('contacts-users-list');
    if (!listEl) return;

    if (contactTicketsList.length === 0) {
      listEl.innerHTML = '<div style="font-size: 13px; text-align: center; color: var(--gray-600); padding: 12px;">Chưa nhận được yêu cầu nào.</div>';
      return;
    }

    listEl.innerHTML = contactTicketsList.map(c => {
      const activeClass = c._id === activeContactId ? 'active' : '';
      let statusBadge = '';
      if (c.status === 'new') {
        statusBadge = `<span class="badge" style="position: relative; display: inline-flex; margin-left: 8px; background: var(--primary); font-size: 9px; padding: 2px 5px; color: white;">NEW</span>`;
      } else if (c.status === 'processing') {
        statusBadge = `<span class="badge" style="position: relative; display: inline-flex; margin-left: 8px; background: #f59e0b; font-size: 9px; padding: 2px 5px; color: white;">PND</span>`;
      }

      return `
        <div class="chat-user-item ${activeClass}" onclick="openContactTicket('${c._id}')">
          <div class="chat-user-name">${c.name} ${statusBadge}</div>
          <div class="chat-user-last">${c.subject}</div>
        </div>
      `;
    }).join('');

    // If there is an active selected ticket, keep it open/refresh it
    if (activeContactId) {
      const activeTicket = contactTicketsList.find(x => x._id === activeContactId);
      if (activeTicket) {
        showContactTicketDetails(activeTicket);
      }
    }
  };

  window.openContactTicket = (id) => {
    activeContactId = id;
    
    // Refresh active class in list
    const items = document.querySelectorAll('#contacts-users-list .chat-user-item');
    contactTicketsList.forEach((c, idx) => {
      if (items[idx]) {
        items[idx].classList.toggle('active', c._id === id);
      }
    });

    const activeTicket = contactTicketsList.find(x => x._id === id);
    if (activeTicket) {
      showContactTicketDetails(activeTicket);
    }
  };

  const showContactTicketDetails = (ticket) => {
    const detailsPanel = document.getElementById('contacts-user-details');
    const headerName = document.getElementById('contacts-header-name');
    const messagesBox = document.getElementById('contacts-chat-messages');
    const inputArea = document.getElementById('contacts-input-area');
    const replyInput = document.getElementById('contacts-reply-input');

    if (!detailsPanel || !headerName || !messagesBox || !inputArea || !replyInput) return;

    headerName.textContent = ticket.name;
    
    let orderHtml = ticket.orderCode ? ` | Mã đơn liên quan: <strong>#${ticket.orderCode}</strong>` : '';
    detailsPanel.innerHTML = `
      SĐT: <strong>${ticket.phone}</strong> | Email: <strong>${ticket.email}</strong><br>
      Chủ đề: <strong>${ticket.subject}</strong>${orderHtml} | Trạng thái: <strong>${ticket.status.toUpperCase()}</strong>
    `;
    detailsPanel.style.display = 'block';

    const dateStr = new Date(ticket.createdAt).toLocaleString('vi-VN');
    
    let chatHtml = `
      <div class="chat-msg received">
        <div style="font-size: 11px; color: var(--gray-500); margin-bottom: 4px;">Khách hàng gửi - ${dateStr}</div>
        <div>${ticket.content}</div>
      </div>
    `;

    if (ticket.staffReply) {
      chatHtml += `
        <div class="chat-msg sent">
          <div style="font-size: 11px; color: rgba(255, 255, 255, 0.7); margin-bottom: 4px;">Phản hồi từ tiệm</div>
          <div>${ticket.staffReply}</div>
        </div>
      `;
    }

    messagesBox.innerHTML = chatHtml;
    messagesBox.scrollTop = messagesBox.scrollHeight;

    if (ticket.status === 'done') {
      inputArea.style.display = 'none';
    } else {
      inputArea.style.display = 'flex';
      replyInput.value = ticket.staffReply || '';
    }
  };

  const initContactActions = () => {
    const sendBtn = document.getElementById('contacts-send-btn');
    const saveBtn = document.getElementById('contacts-save-btn');
    const replyInput = document.getElementById('contacts-reply-input');

    if (sendBtn) {
      sendBtn.onclick = () => submitContactReply('done');
    }
    if (saveBtn) {
      saveBtn.onclick = () => submitContactReply('processing');
    }
  };

  const submitContactReply = async (status) => {
    if (!activeContactId) return;

    const replyInput = document.getElementById('contacts-reply-input');
    const replyText = replyInput ? replyInput.value.trim() : '';

    if (!replyText) {
      showToast('Vui lòng nhập nội dung phản hồi trước khi gửi', 'warning');
      return;
    }

    try {
      const data = await fetchAPI(`/api/contacts/${activeContactId}`, {
        method: 'PUT',
        body: JSON.stringify({ staffReply: replyText, status }),
      });
      if (data.success) {
        showToast(data.message, 'success');
        
        // Reload all and keep same active contact ticket selected
        await loadContactTickets();
      }
    } catch (e) {}
  };

  // Initial load
  initContactActions();
  switchTab('tab-stats');
});
