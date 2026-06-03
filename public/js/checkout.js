// Checkout script
document.addEventListener('DOMContentLoaded', () => {
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutItemsList = document.getElementById('checkout-items-list');

  if (checkoutForm && checkoutItemsList) {
    let currentCart = null;
    let discountAmount = 0;
    let finalAmount = 0;
    let activeCoupon = sessionStorage.getItem('promoCode') || '';

    // Initialize checkout page
    const initCheckout = async () => {
      try {
        // 1. Check Auth & Load Cart
        const authData = await fetchAPI('/api/auth/me');
        if (!authData.success) {
          window.location.href = '/login.html?redirect=checkout';
          return;
        }

        // Pre-fill user data
        document.getElementById('checkout-name').value = authData.user.name || '';
        document.getElementById('checkout-phone').value = authData.user.phone || '';
        document.getElementById('checkout-email').value = authData.user.email || '';
        document.getElementById('checkout-address').value = authData.user.address || '';

        // 2. Load Cart details
        const cartData = await fetchAPI('/api/cart');
        if (cartData.success && cartData.cart.items.length > 0) {
          currentCart = cartData.cart;
          renderOrderSummary(cartData.cart);
          loadUserAddresses();
        } else {
          showToast('Giỏ hàng trống, không thể thanh toán', 'warning');
          setTimeout(() => {
            window.location.href = '/cart.html';
          }, 1000);
        }
      } catch (err) {
        window.location.href = '/login.html';
      }
    };

    // Load addresses book for dropdown selection
    const loadUserAddresses = async () => {
      const addressSelector = document.getElementById('address-book-select');
      if (!addressSelector) return;

      try {
        const data = await fetchAPI('/api/users/addresses');
        if (data.success && data.addresses.length > 0) {
          addressSelector.style.display = 'block';
          
          let options = '<option value="">-- Chọn từ sổ địa chỉ lưu sẵn --</option>';
          data.addresses.forEach(addr => {
            const fullAddress = `${addr.addressDetail}, ${addr.ward}, ${addr.district}, ${addr.city}`;
            options += `<option value="${fullAddress}" data-name="${addr.receiverName}" data-phone="${addr.phone}">${addr.receiverName} - ${fullAddress}</option>`;
          });
          
          addressSelector.innerHTML = options;

          // Listen to changes
          addressSelector.addEventListener('change', (e) => {
            const selectedOpt = addressSelector.options[addressSelector.selectedIndex];
            if (e.target.value) {
              document.getElementById('checkout-address').value = e.target.value;
              document.getElementById('checkout-name').value = selectedOpt.dataset.name;
              document.getElementById('checkout-phone').value = selectedOpt.dataset.phone;
            }
          });
        }
      } catch (e) {}
    };

    // Render summary sidebar panel
    const renderOrderSummary = async (cart) => {
      const subtotal = cart.totalAmount;
      discountAmount = 0;
      finalAmount = subtotal;

      // Calculate discount if coupon active
      if (activeCoupon) {
        try {
          const promoData = await fetchAPI('/api/promotions/apply', {
            method: 'POST',
            body: JSON.stringify({ code: activeCoupon, orderAmount: subtotal }),
          });
          if (promoData.success) {
            discountAmount = promoData.discountAmount;
            finalAmount = promoData.finalAmount;
          }
        } catch (e) {
          activeCoupon = '';
          sessionStorage.removeItem('promoCode');
        }
      }

      // Render items lists
      const itemsHTML = cart.items.map(item => `
        <div class="checkout-summary-item">
          <div>
            <strong>${item.productId.name}</strong> x ${item.quantity}
            <div style="font-size: 11px; color: var(--gray-600);">Size: ${item.size} | Vị: ${item.flavor}</div>
          </div>
          <span>${(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
        </div>
      `).join('');

      const totalsHTML = `
        <h3 style="margin-bottom: 16px;">Tóm tắt đơn hàng</h3>
        <div style="margin-bottom: 20px;">
          ${itemsHTML}
        </div>
        <div class="summary-rows">
          <div class="summary-row">
            <span>Tạm tính:</span>
            <span>${subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
          ${discountAmount > 0 ? `
            <div class="summary-row" style="color: var(--primary-hover);">
              <span>Khuyến mãi (${activeCoupon}):</span>
              <span>- ${discountAmount.toLocaleString('vi-VN')}đ</span>
            </div>
          ` : ''}
          <div class="summary-row">
            <span>Phí vận chuyển:</span>
            <span style="color: var(--success); font-weight: 600;">Miễn phí</span>
          </div>
          <div class="summary-row total">
            <span>Tổng cộng:</span>
            <span>${finalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      `;

      checkoutItemsList.innerHTML = totalsHTML;
    };

    // Toggle Payment instructions
    window.togglePaymentMethod = (method) => {
      document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('active'));
      const activeEl = document.querySelector(`input[value="${method}"]`).closest('.payment-option');
      activeEl.classList.add('active');

      const bankInstructions = document.getElementById('bank-instructions');
      if (bankInstructions) {
        if (method === 'bank_transfer') {
          bankInstructions.style.display = 'block';
          // Draw dynamic mock bank instructions
          bankInstructions.innerHTML = `
            <h4>Thông tin chuyển khoản ngân hàng</h4>
            <p>Vui lòng chuyển khoản đúng số tiền <strong>${finalAmount.toLocaleString('vi-VN')}đ</strong> để tiệm bánh xác nhận sản xuất:</p>
            <div class="qr-code">
              <!-- Using a static visual representation of QR code -->
              <div style="width: 100%; height: 100%; border: 2px solid var(--primary-hover); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: var(--primary-hover); text-align: center; padding: 4px;">
                Sweet Pink Bakery<br>VietQR Mock Code<br>Số tiền: ${finalAmount.toLocaleString('vi-VN')}đ
              </div>
            </div>
            <p style="font-size: 12px; margin-top: 8px;"><strong>Ngân hàng:</strong> MBBank (Ngân hàng Quân Đội)<br>
            <strong>Số tài khoản:</strong> 190288889999<br>
            <strong>Chủ tài khoản:</strong> TIEM BANH SWEET PINK BAKERY<br>
            <strong>Nội dung:</strong> SPB_ChuyenKhoan_Banh</p>
          `;
        } else {
          bankInstructions.style.display = 'none';
        }
      }
    };

    // Set delivery date min limit to +24 hours
    const setDeliveryDateLimits = () => {
      const dateInput = document.getElementById('checkout-date');
      if (!dateInput) return;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const year = tomorrow.getFullYear();
      let month = tomorrow.getMonth() + 1;
      let day = tomorrow.getDate();

      if (month < 10) month = `0${month}`;
      if (day < 10) day = `0${day}`;

      const minDate = `${year}-${month}-${day}`;
      dateInput.min = minDate;
      dateInput.value = minDate; // Set default to tomorrow
    };

    // Handle checkout submit
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullname = document.getElementById('checkout-name').value.trim();
      const phone = document.getElementById('checkout-phone').value.trim();
      const email = document.getElementById('checkout-email').value.trim();
      const address = document.getElementById('checkout-address').value.trim();
      const deliveryDate = document.getElementById('checkout-date').value;
      const deliveryTime = document.getElementById('checkout-time').value;
      const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
      const note = document.getElementById('checkout-note').value.trim();

      if (!fullname || !phone || !email || !address || !deliveryDate || !deliveryTime) {
        showToast('Vui lòng điền đầy đủ các thông tin giao hàng', 'warning');
        return;
      }

      const bodyData = {
        fullname,
        phone,
        email,
        address,
        deliveryDate,
        deliveryTime,
        paymentMethod,
        promoCode: activeCoupon,
        note,
      };

      try {
        const data = await fetchAPI('/api/orders', {
          method: 'POST',
          body: JSON.stringify(bodyData),
        });

        if (data.success && data.order) {
          sessionStorage.removeItem('promoCode');
          showToast(data.message, 'success');
          
          setTimeout(() => {
            // Redirect to tracking page
            window.location.href = `/order-tracking.html?code=${data.order.orderCode}&phone=${phone}`;
          }, 1500);
        }
      } catch (err) {}
    });

    initCheckout();
    setDeliveryDateLimits();
  }
});
