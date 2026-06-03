// Cart page operations
document.addEventListener('DOMContentLoaded', () => {
  const cartTableBody = document.getElementById('cart-table-body');
  const cartSummaryCard = document.getElementById('cart-summary-card');

  if (cartTableBody) {
    let currentCart = null;
    let discountAmount = 0;
    let finalAmount = 0;
    let activeCoupon = sessionStorage.getItem('promoCode') || '';

    // Load cart items
    const loadCart = async () => {
      try {
        const data = await fetchAPI('/api/cart');
        if (data.success) {
          currentCart = data.cart;
          renderCartItems(data.cart.items);
          calculateSummary();
        }
      } catch (err) {
        cartTableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--danger);">Không thể tải thông tin giỏ hàng.</td></tr>';
      }
    };

    // Render cart rows
    const renderCartItems = (items) => {
      if (items.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 40px; color: var(--gray-600);">Giỏ hàng của bạn đang trống. <a href="/products.html" style="color: var(--primary-hover); font-weight: 700; text-decoration: underline;">Mua sắm ngay!</a></td></tr>';
        if (cartSummaryCard) cartSummaryCard.style.display = 'none';
        return;
      }

      if (cartSummaryCard) cartSummaryCard.style.display = 'block';

      cartTableBody.innerHTML = items.map(item => {
        const product = item.productId;
        const price = item.price;
        const subtotal = price * item.quantity;
        const image = product.images[0] || '/public/img/placeholder.jpg';
        const noteText = item.note ? `<div style="font-size: 11px; background-color: var(--primary-light); padding: 4px 8px; border-radius: 4px; margin-top: 4px;">✍️ Ghi chữ: "${item.note}"</div>` : '';

        return `
          <tr>
            <td>
              <div class="cart-item-info">
                <img src="${image}" class="cart-item-img" alt="${product.name}">
                <div class="cart-item-details">
                  <h4><a href="/product-detail.html?slug=${product.slug}">${product.name}</a></h4>
                  <div class="cart-item-meta">Size: ${item.size} | Vị: ${item.flavor}</div>
                  ${noteText}
                </div>
              </div>
            </td>
            <td>
              <span class="cart-item-price">${price.toLocaleString('vi-VN')}đ</span>
            </td>
            <td>
              <div class="qty-selector" style="height: 38px;">
                <button class="qty-btn" onclick="updateQty('${product._id}', '${item.size}', '${item.flavor}', ${item.quantity - 1})">&minus;</button>
                <input type="number" value="${item.quantity}" style="width: 40px;" readonly>
                <button class="qty-btn" onclick="updateQty('${product._id}', '${item.size}', '${item.flavor}', ${item.quantity + 1})">&plus;</button>
              </div>
            </td>
            <td>
              <span class="cart-item-price" style="font-weight: 700;">${subtotal.toLocaleString('vi-VN')}đ</span>
            </td>
            <td>
              <button class="cart-remove-btn" onclick="removeCartItem('${product._id}', '${item.size}', '${item.flavor}')" title="Xóa sản phẩm">&times;</button>
            </td>
          </tr>
        `;
      }).join('');
    };

    // Calculate Summary totals & Coupons
    const calculateSummary = async () => {
      if (!currentCart || currentCart.items.length === 0) return;

      const subtotal = currentCart.totalAmount;
      discountAmount = 0;
      finalAmount = subtotal;

      // If coupon is stored in session, try to reapply
      if (activeCoupon) {
        try {
          const promoData = await fetchAPI('/api/promotions/apply', {
            method: 'POST',
            body: JSON.stringify({ code: activeCoupon, orderAmount: subtotal }),
          });

          if (promoData.success) {
            discountAmount = promoData.discountAmount;
            finalAmount = promoData.finalAmount;
            document.getElementById('coupon-status-msg').innerHTML = `<span style="color: var(--success); font-weight: 600;">Đã áp dụng mã "${activeCoupon.toUpperCase()}" (-${discountAmount.toLocaleString('vi-VN')}đ)</span>`;
          } else {
            sessionStorage.removeItem('promoCode');
            activeCoupon = '';
          }
        } catch (e) {
          sessionStorage.removeItem('promoCode');
          activeCoupon = '';
        }
      }

      // Render summary fields
      const summaryHTML = `
        <h3>Tóm tắt đơn hàng</h3>
        <div class="summary-rows">
          <div class="summary-row">
            <span>Tạm tính:</span>
            <span>${subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
          <div class="summary-row">
            <span>Giảm giá:</span>
            <span id="summary-discount">- ${discountAmount.toLocaleString('vi-VN')}đ</span>
          </div>
          <div class="summary-row">
            <span>Phí vận chuyển:</span>
            <span style="color: var(--success); font-weight: 600;">Miễn phí</span>
          </div>
          <div class="summary-row total">
            <span>Tổng cộng:</span>
            <span>${finalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 12px;">
          <label>Mã giảm giá (Khuyến mãi):</label>
          <div class="coupon-area">
            <input type="text" id="coupon-code-input" class="form-control" placeholder="Mã giảm giá" value="${activeCoupon}">
            <button class="btn btn-secondary" onclick="applyCoupon()" style="padding: 10px 16px;">Áp dụng</button>
          </div>
          <div id="coupon-status-msg" style="font-size: 13px; margin-top: 4px;"></div>
        </div>

        <button class="btn btn-primary btn-block" onclick="goToCheckout()" style="margin-top: 24px;">Tiến hành thanh toán</button>
      `;

      cartSummaryCard.innerHTML = summaryHTML;
    };

    // Update quantities on server
    window.updateQty = async (productId, size, flavor, quantity) => {
      if (quantity < 1) {
        // If 0, delete it
        removeCartItem(productId, size, flavor);
        return;
      }

      try {
        const data = await fetchAPI('/api/cart', {
          method: 'PUT',
          body: JSON.stringify({ productId, size, flavor, quantity }),
        });

        if (data.success) {
          currentCart = data.cart;
          renderCartItems(data.cart.items);
          calculateSummary();
          updateCartBadge();
        }
      } catch (err) {}
    };

    // Remove item on server
    window.removeCartItem = async (productId, size, flavor) => {
      try {
        const data = await fetchAPI('/api/cart/remove', {
          method: 'POST',
          body: JSON.stringify({ productId, size, flavor }),
        });

        if (data.success) {
          showToast(data.message, 'success');
          currentCart = data.cart;
          renderCartItems(data.cart.items);
          calculateSummary();
          updateCartBadge();
        }
      } catch (err) {}
    };

    // Coupon form validation
    window.applyCoupon = async () => {
      const codeInput = document.getElementById('coupon-code-input');
      const code = codeInput.value.trim();
      const statusMsg = document.getElementById('coupon-status-msg');

      if (!code) {
        showToast('Vui lòng điền mã giảm giá', 'warning');
        return;
      }

      if (!currentCart) return;

      try {
        statusMsg.innerHTML = '<span style="color: var(--gray-600);">Đang áp dụng...</span>';
        const data = await fetchAPI('/api/promotions/apply', {
          method: 'POST',
          body: JSON.stringify({ code, orderAmount: currentCart.totalAmount }),
        });

        if (data.success) {
          showToast(data.message, 'success');
          activeCoupon = code.toUpperCase();
          sessionStorage.setItem('promoCode', activeCoupon);
          calculateSummary();
        }
      } catch (err) {
        statusMsg.innerHTML = `<span style="color: var(--danger); font-weight: 500;">${err.message}</span>`;
      }
    };

    // Proceed to checkout page
    window.goToCheckout = () => {
      window.location.href = '/checkout.html';
    };

    // Initial load
    loadCart();
  }
});
