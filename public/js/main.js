// Toast System
const showToast = (message, type = 'primary') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '🔔';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'danger') icon = '❌';

  toast.innerHTML = `
    <span>${icon}</span>
    <div>${message}</div>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);

  // Close button functionality
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  });

  // Auto remove after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
};

// API Client wrapper to handle fetches cleaner
const fetchAPI = async (url, options = {}) => {
  const silent = options.silent || false;
  
  // Ensure cookies are sent
  options.credentials = 'include';
  
  // Set headers if not multipart form
  if (!(options.body instanceof FormData)) {
    if (!options.headers) {
      options.headers = {};
    }
    if (!options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Lỗi xử lý yêu cầu hệ thống');
    }
    return data;
  } catch (error) {
    if (!silent) {
      showToast(error.message, 'danger');
    }
    throw error;
  }
};

// Floating Support Chat Widget
const initSupportChatWidget = (currentUser) => {
  if (document.getElementById('support-chat-btn')) return;

  const style = document.createElement('style');
  style.textContent = `
    .support-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background-color: var(--primary);
      color: var(--light);
      border: none;
      border-radius: 30px;
      padding: 12px 20px;
      font-family: var(--font-title);
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(255, 143, 163, 0.35);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 9999;
      transition: all 0.3s ease;
    }
    .support-chat-btn:hover {
      background-color: var(--primary-hover);
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(255, 143, 163, 0.5);
    }
    .support-chat-window {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 360px;
      height: 480px;
      background-color: var(--light);
      border-radius: var(--radius-md);
      border: 1px solid var(--primary-light);
      box-shadow: var(--shadow-lg);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
      font-family: var(--font-body);
      animation: supportChatSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes supportChatSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .support-chat-header {
      background-color: var(--primary);
      color: var(--light);
      padding: 14px 20px;
      font-family: var(--font-title);
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .support-chat-close {
      background: none;
      border: none;
      color: var(--light);
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
    }
    .support-chat-messages {
      flex-grow: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background-color: #fafbfc;
    }
    .support-chat-msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.4;
      word-break: break-word;
    }
    .support-chat-msg.sent {
      align-self: flex-end;
      background-color: var(--primary);
      color: var(--light);
      border-bottom-right-radius: 2px;
    }
    .support-chat-msg.received {
      align-self: flex-start;
      background-color: var(--gray-200);
      color: var(--dark);
      border-bottom-left-radius: 2px;
    }
    .support-chat-input-area {
      padding: 12px;
      border-top: 1px solid var(--gray-200);
      display: flex;
      gap: 8px;
      background-color: var(--light);
    }
    .support-chat-input {
      flex-grow: 1;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
    }
    .support-chat-send {
      background-color: var(--primary);
      color: var(--light);
      border: none;
      border-radius: var(--radius-sm);
      padding: 8px 16px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: var(--transition);
    }
    .support-chat-send:hover {
      background-color: var(--primary-hover);
    }
  `;
  document.head.appendChild(style);

  const chatBtn = document.createElement('button');
  chatBtn.className = 'support-chat-btn';
  chatBtn.id = 'support-chat-btn';
  chatBtn.innerHTML = '💬 Chat hỗ trợ';
  document.body.appendChild(chatBtn);

  const chatWindow = document.createElement('div');
  chatWindow.className = 'support-chat-window';
  chatWindow.id = 'support-chat-window';
  chatWindow.innerHTML = `
    <div class="support-chat-header">
      <span>🌸 Sweet Pink Support</span>
      <button class="support-chat-close" id="support-chat-close">&times;</button>
    </div>
    <div class="support-chat-messages" id="support-chat-messages"></div>
    <div class="support-chat-input-area" id="support-chat-input-area"></div>
  `;
  document.body.appendChild(chatWindow);

  const messagesBox = chatWindow.querySelector('#support-chat-messages');
  const inputArea = chatWindow.querySelector('#support-chat-input-area');

  let activeInterval = null;
  let adminId = '';

  if (!currentUser) {
    messagesBox.innerHTML = '<div style="text-align: center; color: var(--gray-600); margin: auto; padding: 24px; font-size: 13px;">Vui lòng đăng nhập để trò chuyện trực tiếp với nhân viên hỗ trợ.</div>';
    inputArea.innerHTML = '<a href="/login.html" class="btn btn-primary btn-block" style="font-size: 13px; padding: 10px; width: 100%; text-align: center;">Đăng nhập ngay</a>';
  } else {
    inputArea.innerHTML = `
      <input type="text" class="support-chat-input" id="support-chat-input" placeholder="Nhập tin nhắn...">
      <button class="support-chat-send" id="support-chat-send">Gửi</button>
    `;

    const loadMessages = async () => {
      if (!adminId) {
        try {
          const res = await fetchAPI('/api/messages/support/recipient', { silent: true });
          if (res.success && res.recipient) {
            adminId = res.recipient._id;
          }
        } catch (e) {
          messagesBox.innerHTML = '<div style="text-align: center; color: var(--danger); font-size: 13px; margin: auto;">Không thể kết nối bộ phận hỗ trợ.</div>';
          return;
        }
      }

      if (adminId) {
        try {
          const res = await fetchAPI(`/api/messages/${adminId}`, { silent: true });
          if (res.success && res.messages) {
            if (res.messages.length === 0) {
              messagesBox.innerHTML = '<div style="text-align: center; color: var(--gray-600); margin: auto; padding: 24px; font-size: 13px;">Gửi tin nhắn để bắt đầu cuộc trò chuyện với tiệm bánh!</div>';
            } else {
              messagesBox.innerHTML = res.messages.map(msg => {
                const myId = (currentUser.id || currentUser._id || '').toString();
                const senderIdStr = (msg.senderId._id || msg.senderId || '').toString();
                const alignClass = senderIdStr === myId ? 'sent' : 'received';
                return `<div class="support-chat-msg ${alignClass}">${msg.content}</div>`;
              }).join('');
              messagesBox.scrollTop = messagesBox.scrollHeight;
            }
          }
        } catch (e) {}
      }
    };

    const sendMessage = async () => {
      const inputEl = inputArea.querySelector('#support-chat-input');
      const content = inputEl.value.trim();
      if (!content) return;

      try {
        const res = await fetchAPI('/api/messages', {
          method: 'POST',
          body: JSON.stringify({ receiverId: adminId, content }),
          silent: true
        });
        if (res.success) {
          inputEl.value = '';
          loadMessages();
        }
      } catch (e) {}
    };

    inputArea.querySelector('#support-chat-send').addEventListener('click', sendMessage);
    inputArea.querySelector('#support-chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    chatBtn.addEventListener('click', () => {
      if (chatWindow.style.display === 'flex') {
        chatWindow.style.display = 'none';
        if (activeInterval) {
          clearInterval(activeInterval);
          activeInterval = null;
        }
      } else {
        chatWindow.style.display = 'flex';
        loadMessages();
        activeInterval = setInterval(loadMessages, 5000);
      }
    });

    chatWindow.querySelector('#support-chat-close').addEventListener('click', () => {
      chatWindow.style.display = 'none';
      if (activeInterval) {
        clearInterval(activeInterval);
        activeInterval = null;
      }
    });
  }

  if (!currentUser) {
    chatBtn.addEventListener('click', () => {
      chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
    });
    chatWindow.querySelector('#support-chat-close').addEventListener('click', () => {
      chatWindow.style.display = 'none';
    });
  }
};

// Global authentication checks & UI syncs
const syncNavbarAuth = async () => {
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  try {
    const data = await fetchAPI('/api/auth/me', { silent: true });
    if (data.success && data.user) {
      // User is logged in
      const user = data.user;
      let dashboardUrl = '/user-dashboard.html';
      if (user.role === 'staff') dashboardUrl = '/staff-dashboard.html';
      if (user.role === 'admin') dashboardUrl = '/admin-dashboard.html';

      let avatarHtml = '👤';
      if (user.avatar) {
        avatarHtml = `<img src="${user.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      } else {
        if (user.role === 'admin') avatarHtml = '👑';
        else if (user.role === 'staff') avatarHtml = '👩‍🍳';
      }

      navActions.innerHTML = `
        <a href="/cart.html" class="icon-btn" title="Giỏ hàng">
          🛒
          <span class="badge" id="cart-badge">0</span>
        </a>
        <div class="user-menu">
          <button class="icon-btn" title="Tài khoản" style="padding: 0; overflow: hidden; display: flex; align-items: center; justify-content: center;">${avatarHtml}</button>
          <ul class="user-dropdown">
            <li><div style="padding: 10px 16px; font-weight: 700; border-bottom: 1px solid var(--gray-200); font-size: 13px; color: var(--primary-hover);">${user.name}</div></li>
            <li><a href="${dashboardUrl}">📊 Dashboard</a></li>
            <li><button id="logout-btn">🚪 Đăng xuất</button></li>
          </ul>
        </div>
      `;

      // Mount logout event
      document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
          const res = await fetchAPI('/api/auth/logout', { method: 'POST' });
          if (res.success) {
            showToast(res.message, 'success');
            setTimeout(() => {
              window.location.href = '/index.html';
            }, 1000);
          }
        } catch (e) {}
      });

      // Toggle user menu dropdown on click
      const userMenu = navActions.querySelector('.user-menu');
      if (userMenu) {
        const trigger = userMenu.querySelector('button');
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          userMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
          if (!userMenu.contains(e.target)) {
            userMenu.classList.remove('active');
          }
        });
      }

      // Update cart count
      updateCartBadge();

      // Show chat widget if customer
      if (user.role !== 'admin' && user.role !== 'staff') {
        initSupportChatWidget(user);
      }
    }
  } catch (err) {
    // User is guest, show login/register buttons
    navActions.innerHTML = `
      <a href="/login.html" class="btn btn-secondary" style="padding: 8px 16px; font-size: 14px;">Đăng nhập</a>
      <a href="/register.html" class="btn btn-primary" style="padding: 8px 16px; font-size: 14px;">Đăng ký</a>
    `;
    initSupportChatWidget(null);
  }
};

// Update cart badge dynamically
const updateCartBadge = async () => {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  try {
    const data = await fetchAPI('/api/cart', { silent: true });
    if (data.success && data.cart) {
      const totalItems = data.cart.items.reduce((sum, item) => sum + item.quantity, 0);
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
  } catch (err) {
    badge.style.display = 'none';
  }
};

// Load global settings (logo, footer, contact info) dynamically
const loadGlobalSettings = async () => {
  try {
    const data = await fetchAPI('/api/settings', { silent: true });
    if (data.success && data.settings) {
      const settings = data.settings;

      // Check if logoIcon is an image path/URL or emoji/character
      const isImg = settings.logoIcon && (
        settings.logoIcon.startsWith('/') ||
        settings.logoIcon.startsWith('http') ||
        settings.logoIcon.startsWith('data:image/') ||
        settings.logoIcon.match(/\.(png|jpg|jpeg|gif|svg|webp)/i)
      );
      
      const logoIconHTML = isImg
        ? `<img src="${settings.logoIcon}" alt="Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
        : (settings.logoIcon || '🍰');

      // Update all elements with class "logo"
      const logoElements = document.querySelectorAll('.logo');
      logoElements.forEach((logo) => {
        logo.innerHTML = `<span class="logo-icon">${logoIconHTML}</span> ${settings.logoText || 'Sweet Pink Bakery & Tea Break'}`;
      });

      // Update footer details if a footer tag exists
      const footer = document.querySelector('footer');
      if (footer) {
        footer.innerHTML = `
          <div class="container footer-grid">
            <div class="footer-col">
              <a href="/index.html" class="logo" style="margin-bottom: 16px;">
                <span class="logo-icon">${logoIconHTML}</span> ${settings.logoText || 'Sweet Pink Bakery & Tea Break'}
              </a>
              <p>${settings.footerDesc || 'Cung cấp dịch vụ tiệc ngọt hội nghị, khai trương, tiệc trà chiều doanh nghiệp và các dòng mini cake tinh tế hàng đầu.'}</p>
              <div class="social-links">
                <a href="${settings.socialFb || '#'}" class="social-icon" target="_blank" title="Facebook">🔵</a>
                <a href="${settings.socialInsta || '#'}" class="social-icon" target="_blank" title="Instagram">📸</a>
                <a href="${settings.socialYoutube || '#'}" class="social-icon" target="_blank" title="Youtube">🔴</a>
              </div>
            </div>
            <div class="footer-col">
              <h3>Liên kết nhanh</h3>
              <ul class="footer-links">
                <li><a href="/index.html">Trang chủ</a></li>
                <li><a href="/products.html">Sản phẩm bánh</a></li>
                <li><a href="/teabreak.html">Đặt tiệc Tea Break</a></li>
                <li><a href="/contact.html">Liên hệ tư vấn</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h3>Dịch vụ</h3>
              <ul class="footer-links">
                <li><a href="/teabreak.html">Corporate Orders</a></li>
                <li><a href="/teabreak.html">Tea Break Packages</a></li>
                <li><a href="/products.html?category=mini-cake">Mini Cake nhỏ xinh</a></li>
                <li><a href="/products.html?search=Tiramisu">Tiramisu cao cấp</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h3>Liên hệ & Giờ mở cửa</h3>
              <p>📍 ${settings.address || '123 Đường Hồng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'}</p>
              <p>📞 Hotline: ${settings.phone || '0988.888.888'}</p>
              <p>📧 Email: ${settings.email || 'support@sweetpinkbakery.vn'}</p>
              <p>🕒 ${settings.openingHours || 'Mở cửa từ 07:30 - 21:00 hàng ngày (Cả ngày lễ)'}</p>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; ${new Date().getFullYear()} ${settings.logoText || 'Sweet Pink Bakery & Tea Break'}. All rights reserved.</p>
          </div>
        `;
      }

      // Update contact map if container exists
      const contactMap = document.getElementById('contact-map');
      if (contactMap && settings.mapEmbed) {
        contactMap.innerHTML = settings.mapEmbed;
      }
    }
  } catch (err) {
    console.error('Lỗi khi tải cấu hình hệ thống:', err);
  }
};

// Expose globally to allow other scripts (like admin dashboard) to reload
window.loadGlobalSettings = loadGlobalSettings;

// Initial calls on page load
document.addEventListener('DOMContentLoaded', () => {
  syncNavbarAuth();
  loadGlobalSettings();
  
  // Mobile Nav Toggle helper if element is written in HTML
  const mobToggle = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobToggle && navLinks) {
    mobToggle.addEventListener('click', () => {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '80px';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.backgroundColor = '#ffffff';
      navLinks.style.padding = '16px';
      navLinks.style.boxShadow = 'var(--shadow-md)';
    });
  }
});

// Click anywhere on product card to navigate to its details page (except interactive buttons/links)
document.addEventListener('click', (e) => {
  const card = e.target.closest('.product-card');
  if (!card) return;

  // Let buttons, links, or inputs handle their own clicks
  const interactiveElement = e.target.closest('button, a, input, select, textarea');
  if (interactiveElement) return;

  const link = card.querySelector('a[href*="product-detail.html"]');
  if (link && link.href) {
    window.location.href = link.href;
  }
});

// Custom Confirm Modal Replacement
const showConfirmModal = (message, onConfirm, onCancel = null) => {
  let modalEl = document.getElementById('custom-confirm-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'custom-confirm-modal';
    modalEl.className = 'admin-modal';
    modalEl.innerHTML = `
      <div class="modal-content-card" style="max-width: 480px;">
        <div class="modal-header-row">
          <h3>Xác nhận</h3>
          <button class="modal-close-btn" id="custom-confirm-close">&times;</button>
        </div>
        <div class="modal-body">
          <p id="custom-confirm-message" style="font-size: 15px; line-height: 1.5; color: var(--dark);"></p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="custom-confirm-btn-cancel" style="padding: 10px 20px;">Hủy</button>
          <button class="btn btn-primary" id="custom-confirm-btn-ok" style="padding: 10px 20px;">Xác nhận</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  document.getElementById('custom-confirm-message').textContent = message;
  
  const closeModal = () => {
    modalEl.classList.remove('active');
  };

  const handleConfirm = () => {
    closeModal();
    if (typeof onConfirm === 'function') onConfirm();
  };

  const handleCancel = () => {
    closeModal();
    if (typeof onCancel === 'function') onCancel();
  };

  const btnOk = document.getElementById('custom-confirm-btn-ok');
  const btnCancel = document.getElementById('custom-confirm-btn-cancel');
  const btnClose = document.getElementById('custom-confirm-close');

  const newBtnOk = btnOk.cloneNode(true);
  const newBtnCancel = btnCancel.cloneNode(true);
  const newBtnClose = btnClose.cloneNode(true);

  btnOk.parentNode.replaceChild(newBtnOk, btnOk);
  btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
  btnClose.parentNode.replaceChild(newBtnClose, btnClose);

  newBtnOk.addEventListener('click', handleConfirm);
  newBtnCancel.addEventListener('click', handleCancel);
  newBtnClose.addEventListener('click', handleCancel);

  modalEl.classList.add('active');
};

// Custom Prompt Modal Replacement
const showPromptModal = (message, defaultValue = '', onSubmit, onCancel = null) => {
  let modalEl = document.getElementById('custom-prompt-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'custom-prompt-modal';
    modalEl.className = 'admin-modal';
    modalEl.innerHTML = `
      <div class="modal-content-card" style="max-width: 480px;">
        <div class="modal-header-row">
          <h3>Yêu cầu nhập thông tin</h3>
          <button class="modal-close-btn" id="custom-prompt-close">&times;</button>
        </div>
        <div class="modal-body">
          <p id="custom-prompt-message" style="font-size: 15px; line-height: 1.5; color: var(--dark); margin-bottom: 12px;"></p>
          <div class="form-group" style="margin-bottom: 0;">
            <input type="text" id="custom-prompt-input" class="form-control" style="width: 100%; padding: 10px; border: 1px solid var(--gray-300); border-radius: var(--radius-sm);">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="custom-prompt-btn-cancel" style="padding: 10px 20px;">Hủy</button>
          <button class="btn btn-primary" id="custom-prompt-btn-ok" style="padding: 10px 20px;">Đồng ý</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  document.getElementById('custom-prompt-message').textContent = message;
  const inputEl = document.getElementById('custom-prompt-input');
  inputEl.value = defaultValue;

  const closeModal = () => {
    modalEl.classList.remove('active');
  };

  const handleConfirm = () => {
    const val = inputEl.value;
    closeModal();
    if (typeof onSubmit === 'function') onSubmit(val);
  };

  const handleCancel = () => {
    closeModal();
    if (typeof onCancel === 'function') onCancel();
  };

  const btnOk = document.getElementById('custom-prompt-btn-ok');
  const btnCancel = document.getElementById('custom-prompt-btn-cancel');
  const btnClose = document.getElementById('custom-prompt-close');

  const newBtnOk = btnOk.cloneNode(true);
  const newBtnCancel = btnCancel.cloneNode(true);
  const newBtnClose = btnClose.cloneNode(true);

  btnOk.parentNode.replaceChild(newBtnOk, btnOk);
  btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
  btnClose.parentNode.replaceChild(newBtnClose, btnClose);

  newBtnOk.addEventListener('click', handleConfirm);
  newBtnCancel.addEventListener('click', handleCancel);
  newBtnClose.addEventListener('click', handleCancel);

  modalEl.classList.add('active');
  setTimeout(() => inputEl.focus(), 100);
};

// Field validation error helpers
const showFieldError = (inputEl, message) => {
  if (!inputEl) return;
  const formGroup = inputEl.closest('.form-group') || inputEl.parentNode;
  formGroup.classList.add('has-error');
  
  let errorEl = formGroup.querySelector('.field-error-msg');
  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'field-error-msg';
    formGroup.appendChild(errorEl);
  }
  errorEl.textContent = message;
  errorEl.style.display = 'block';
};

const hideFieldError = (inputEl) => {
  if (!inputEl) return;
  const formGroup = inputEl.closest('.form-group') || inputEl.parentNode;
  formGroup.classList.remove('has-error');
  
  const errorEl = formGroup.querySelector('.field-error-msg');
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }
};

// Expose functions globally
window.showConfirmModal = showConfirmModal;
window.showPromptModal = showPromptModal;
window.showFieldError = showFieldError;
window.hideFieldError = hideFieldError;
