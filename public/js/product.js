// Product scripts
document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById('product-grid');
  const catalogFiltersForm = document.getElementById('catalog-filters-form');

  // Load products list page
  if (productGrid) {
    let currentPage = 1;
    let currentCategory = new URLSearchParams(window.location.search).get('category') || '';
    const currentSearch = new URLSearchParams(window.location.search).get('search') || '';

    // Pre-fill search input if present in URL query
    const searchInputEl = document.getElementById('search-input');
    if (searchInputEl && currentSearch) {
      searchInputEl.value = currentSearch;
    }

    // Main fetch products function
    const loadProducts = async () => {
      let url = `/api/products?page=${currentPage}&limit=9`;
      
      if (currentCategory) {
        url += `&category=${currentCategory}`;
      }

      // Add other filter values from form if exists
      if (catalogFiltersForm) {
        const searchInput = document.getElementById('search-input')?.value;
        if (searchInput) url += `&search=${encodeURIComponent(searchInput)}`;

        const sortSelect = document.getElementById('sort-select')?.value;
        if (sortSelect) url += `&sort=${sortSelect}`;

        const priceMin = document.getElementById('price-min')?.value;
        if (priceMin) url += `&priceMin=${priceMin}`;

        const priceMax = document.getElementById('price-max')?.value;
        if (priceMax) url += `&priceMax=${priceMax}`;

        // Get checked flavors
        const checkedFlavors = Array.from(document.querySelectorAll('input[name="flavor"]:checked')).map(el => el.value);
        checkedFlavors.forEach(f => url += `&flavor=${encodeURIComponent(f)}`);

        // Get checked sizes
        const checkedSizes = Array.from(document.querySelectorAll('input[name="size"]:checked')).map(el => el.value);
        checkedSizes.forEach(s => url += `&size=${encodeURIComponent(s)}`);

        // Collection filters
        const isFeatured = document.getElementById('filter-featured')?.checked;
        if (isFeatured) url += `&isFeatured=true`;
        
        const isBestSeller = document.getElementById('filter-bestseller')?.checked;
        if (isBestSeller) url += `&isBestSeller=true`;

        const isSeasonal = document.getElementById('filter-seasonal')?.checked;
        if (isSeasonal) url += `&isSeasonal=true`;
      }

      productGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--primary-hover); font-weight: 600;">Đang tải danh sách bánh...</div>';

      try {
        const data = await fetchAPI(url);
        if (data.success) {
          renderProducts(data.products);
          renderPagination(data.totalPages, data.currentPage);
        }
      } catch (err) {
        productGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">Không thể tải sản phẩm bánh. Vui lòng thử lại.</div>';
      }
    };

    // Render Product Cards
    const renderProducts = (products) => {
      if (products.length === 0) {
        productGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--gray-600);">Không tìm thấy bánh nào phù hợp với bộ lọc.</div>';
        return;
      }

      productGrid.innerHTML = products.map(product => {
        const price = product.discountPrice || product.price;
        const discountBadge = product.oldPrice ? `<span class="product-badge badge-sale">GIẢM GIÁ</span>` : '';
        const preorderBadge = product.status === 'need_preorder' ? `<span class="product-badge badge-preorder">ĐẶT TRƯỚC</span>` : '';
        const outOfStockBadge = product.stock === 0 || product.status === 'out_of_stock' ? `<span class="product-badge badge-soon" style="background-color: var(--gray-600)">HẾT HÀNG</span>` : '';
        
        const badge = outOfStockBadge || discountBadge || preorderBadge;
        const image = product.images[0] || '/public/img/placeholder.jpg';

        return `
          <div class="product-card">
            ${badge}
            <button class="product-fav-btn" onclick="toggleFavorite('${product._id}')" title="Thêm vào yêu thích">❤️</button>
            <a href="/product-detail.html?slug=${product.slug}" class="product-img-wrapper">
              <img src="${image}" alt="${product.name}">
            </a>
            <div class="product-info">
              <div class="product-category">${product.categoryId?.name || 'Bánh Ngọt'}</div>
              <a href="/product-detail.html?slug=${product.slug}">
                <h3 class="product-title">${product.name}</h3>
              </a>
              <div class="product-rating">
                ⭐ ${product.ratingAverage || '5.0'} <span class="product-rating-count">(${product.reviewCount || 0} đánh giá)</span>
              </div>
              <div class="product-price-row">
                <div class="price-box">
                  <span class="current-price">${price.toLocaleString('vi-VN')}đ</span>
                  ${product.oldPrice ? `<span class="old-price">${product.oldPrice.toLocaleString('vi-VN')}đ</span>` : ''}
                </div>
                ${product.stock > 0 && product.status !== 'out_of_stock' ? `
                  <button class="card-add-btn" onclick="quickAddCart('${product._id}', '${product.size[0] || 'Standard'}', '${product.flavor[0] || 'Vani'}')" title="Thêm nhanh vào giỏ">🛒</button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    // Render Pagination Buttons
    const renderPagination = (totalPages, currentPageNum) => {
      const paginationEl = document.getElementById('pagination');
      if (!paginationEl) return;

      if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
      }

      let buttons = '';
      for (let i = 1; i <= totalPages; i++) {
        buttons += `
          <button class="page-btn ${i === currentPageNum ? 'active' : ''}" onclick="changePage(${i})">
            ${i}
          </button>
        `;
      }
      paginationEl.innerHTML = buttons;
    };

    // Debounce helper
    const debounce = (func, delay) => {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
      };
    };

    const debouncedLoadProducts = debounce(loadProducts, 300);

    // Global handles for pagination / catalog triggers
    window.changePage = (page) => {
      currentPage = page;
      loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Category checkboxes mutual exclusivity and URL sync
    const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
    categoryCheckboxes.forEach(cb => {
      // Sync initial state from currentCategory — simple equality:
      // All checkbox (value="") is checked when currentCategory is empty,
      // specific category checkbox is checked when its value matches.
      cb.checked = (cb.value === currentCategory);

      cb.addEventListener('click', (e) => {
        // Uncheck all other category checkboxes
        categoryCheckboxes.forEach(other => {
          if (other !== cb) {
            other.checked = false;
          }
        });

        // Ensure at least one checked, default back to "" (All)
        if (!cb.checked) {
          const allBox = Array.from(categoryCheckboxes).find(box => box.value === "");
          if (allBox) allBox.checked = true;
          currentCategory = "";
        } else {
          currentCategory = cb.value;
        }

        // Push URL state
        const newUrl = new URL(window.location);
        if (currentCategory) {
          newUrl.searchParams.set('category', currentCategory);
        } else {
          newUrl.searchParams.delete('category');
        }
        history.pushState({}, '', newUrl);

        currentPage = 1;
        debouncedLoadProducts();
      });
    });

    // Listen to filter submit / updates
    if (catalogFiltersForm) {
      catalogFiltersForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentPage = 1;
        loadProducts();
      });

      // Filter checkbox/select triggers (excluding category handled above)
      catalogFiltersForm.addEventListener('change', (e) => {
        if (e.target.name === 'category') return;
        currentPage = 1;
        debouncedLoadProducts();
      });

      // Price range inputs: also fire on 'input' (every keystroke, with debounce)
      // so the filter responds immediately as user types instead of only on blur.
      const priceMinEl = document.getElementById('price-min');
      const priceMaxEl = document.getElementById('price-max');
      if (priceMinEl) priceMinEl.addEventListener('input', () => { currentPage = 1; debouncedLoadProducts(); });
      if (priceMaxEl) priceMaxEl.addEventListener('input', () => { currentPage = 1; debouncedLoadProducts(); });
    }

    // Load initial
    loadProducts();
  }

  // Load product details page
  const detailContainer = document.getElementById('product-detail-container');
  if (detailContainer) {
    const loadProductDetails = async () => {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('slug');
      if (!slug) {
        detailContainer.innerHTML = '<div class="text-center" style="padding: 60px; color: var(--danger);">Không xác định được sản phẩm cần xem.</div>';
        return;
      }

      try {
        const data = await fetchAPI(`/api/products/${slug}`);
        if (data.success && data.product) {
          renderProductDetails(data.product);
          loadReviews(data.product._id);
        }
      } catch (err) {
        detailContainer.innerHTML = '<div class="text-center" style="padding: 60px; color: var(--danger);">Không tìm thấy thông tin sản phẩm bánh này.</div>';
      }
    };

    const renderProductDetails = (product) => {
      const price = product.discountPrice || product.price;
      const imagesList = product.images.length > 0 ? product.images : ['/public/img/placeholder.jpg'];
      
      // Sizes and flavors lists
      const sizesHTML = product.size.map((s, idx) => `
        <span class="capsule size-capsule ${idx === 0 ? 'active' : ''}" onclick="selectCapsule(this, 'size-capsule')">${s}</span>
      `).join('');

      const flavorsHTML = product.flavor.map((f, idx) => `
        <span class="capsule flavor-capsule ${idx === 0 ? 'active' : ''}" onclick="selectCapsule(this, 'flavor-capsule')">${f}</span>
      `).join('');

      // Thumbnail gallery
      const thumbsHTML = imagesList.map((img, idx) => `
        <div class="thumb-card ${idx === 0 ? 'active' : ''}" onclick="switchDetailImage(this, '${img}')">
          <img src="${img}" alt="${product.name}">
        </div>
      `).join('');

      detailContainer.innerHTML = `
        <div class="detail-layout">
          <!-- Image Column -->
          <div class="gallery-container">
            <div class="main-image-view">
              <img id="detail-main-img" src="${imagesList[0]}" alt="${product.name}">
            </div>
            <div class="thumbnail-row">
              ${thumbsHTML}
            </div>
          </div>
 
          <!-- Description Column -->
          <div class="details-panel">
            <div class="product-category">${product.categoryId?.name || 'Bánh Ngọt'}</div>
            <h1>${product.name}</h1>
            <div class="detail-meta">
              <span style="color: var(--warning);">⭐ ${product.ratingAverage || '5.0'} (${product.reviewCount || 0} đánh giá)</span>
              <span class="text-muted">Mã: <strong>${product.code}</strong></span>
              <span class="status-indicator">
                <span class="status-dot ${product.stock > 0 && product.status !== 'out_of_stock' ? 'available' : 'blocked'}"></span>
                ${product.stock > 0 && product.status !== 'out_of_stock' ? 'Còn hàng' : 'Hết hàng'}
              </span>
            </div>
 
            <div class="detail-price-box">
              <span class="detail-price">${price.toLocaleString('vi-VN')}đ</span>
              ${product.oldPrice ? `<span class="detail-old-price">${product.oldPrice.toLocaleString('vi-VN')}đ</span>` : ''}
            </div>
 
            <p class="detail-desc">${product.description}</p>
 
            <!-- Size Selection -->
            <div class="variation-group">
              <h4>Kích thước bánh:</h4>
              <div class="variation-capsules" id="detail-sizes">
                ${sizesHTML}
              </div>
            </div>
 
            <!-- Flavor Selection -->
            <div class="variation-group">
              <h4>Hương vị:</h4>
              <div class="variation-capsules" id="detail-flavors">
                ${flavorsHTML}
              </div>
            </div>
 
            <!-- Custom Lettering note -->
            <div class="form-group" style="margin-top: 24px;">
              <label for="detail-note">Ghi chú viết chữ hoặc yêu cầu đặc biệt (Tùy chọn):</label>
              <input type="text" id="detail-note" class="form-control" placeholder="Ví dụ: Viết chữ HPBD, yêu cầu đóng hộp quà hoặc ghi chú set-up tiệc">
            </div>
 
            <!-- Add to Cart area -->
            <div style="margin-top: 32px;">
              <div class="add-action-area">
                <div class="qty-selector">
                  <button class="qty-btn" onclick="changeQty(-1)">&minus;</button>
                  <input type="number" id="detail-qty" value="1" min="1" readonly>
                  <button class="qty-btn" onclick="changeQty(1)">&plus;</button>
                </div>
                
                ${product.stock > 0 && product.status !== 'out_of_stock' ? `
                  <button class="btn btn-primary" onclick="addProductToCart('${product._id}')" style="flex-grow: 1;">Thêm vào giỏ</button>
                  <button class="btn btn-outline" onclick="buyNow('${product._id}')">Mua ngay</button>
                ` : `
                  <button class="btn btn-primary" disabled style="flex-grow: 1;">Tạm hết hàng</button>
                `}
              </div>
            </div>
 
            <!-- Specifications Table -->
            <table class="specs-table">
              ${product.ingredients ? `<tr><td>Thành phần chính:</td><td>${product.ingredients}</td></tr>` : ''}
              ${product.weight ? `<tr><td>Trọng lượng:</td><td>${product.weight}</td></tr>` : ''}
              ${product.serving ? `<tr><td>Khẩu phần:</td><td>${product.serving}</td></tr>` : ''}
              <tr><td>Bảo quản:</td><td>Tủ mát tủ lạnh (2 - 8°C). Hạn sử dụng 2 ngày kể từ ngày nhận bánh.</td></tr>
            </table>
          </div>
        </div>
      `;
    };

    // Global detail actions helpers
    window.switchDetailImage = (element, imgUrl) => {
      document.querySelectorAll('.thumb-card').forEach(el => el.classList.remove('active'));
      element.classList.add('active');
      document.getElementById('detail-main-img').src = imgUrl;
    };

    window.selectCapsule = (element, className) => {
      document.querySelectorAll(`.${className}`).forEach(el => el.classList.remove('active'));
      element.classList.add('active');
    };

    window.changeQty = (amount) => {
      const qtyInput = document.getElementById('detail-qty');
      let currentVal = parseInt(qtyInput.value, 10);
      currentVal += amount;
      if (currentVal < 1) currentVal = 1;
      qtyInput.value = currentVal;
    };

    window.addProductToCart = async (productId, redirect = false) => {
      const size = document.querySelector('.size-capsule.active')?.textContent || 'Standard';
      const flavor = document.querySelector('.flavor-capsule.active')?.textContent || 'Vani';
      const quantity = parseInt(document.getElementById('detail-qty').value, 10);
      const note = document.getElementById('detail-note').value;

      try {
        const data = await fetchAPI('/api/cart', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity, size, flavor, note }),
        });

        if (data.success) {
          showToast('Đã thêm bánh vào giỏ hàng thành công!', 'success');
          updateCartBadge();
          if (redirect) {
            setTimeout(() => {
              window.location.href = '/cart.html';
            }, 500);
          }
        }
      } catch (err) {
        if (err.message.includes('đăng nhập')) {
          showToast('Vui lòng đăng nhập tài khoản khách hàng để thêm bánh vào giỏ', 'warning');
          setTimeout(() => {
            window.location.href = '/login.html';
          }, 1500);
        }
      }
    };

    window.buyNow = async (productId) => {
      await addProductToCart(productId, true);
    };

    // Load reviews list
    const loadReviews = async (productId) => {
      const reviewsListEl = document.getElementById('reviews-list');
      if (!reviewsListEl) return;

      try {
        const data = await fetchAPI(`/api/reviews/product/${productId}`);
        if (data.success && data.reviews.length > 0) {
          const reviewsHTML = data.reviews.map(review => {
            const stars = '⭐'.repeat(review.rating);
            const reviewImgHTML = review.images.map(img => `
              <img src="${img}" class="review-img" onclick="window.open('${img}')" alt="Review Photo">
            `).join('');

            const replyHTML = review.reply ? `
              <div class="review-reply">
                <div class="review-reply-title">Phản hồi từ tiệm bánh:</div>
                <div>${review.reply}</div>
              </div>
            ` : '';

            return `
              <div class="review-card">
                <div class="review-user-row">
                  <div>
                    <span class="reviewer-name">${review.userId.name}</span>
                    <span style="color: var(--warning); margin-left: 8px;">${stars}</span>
                  </div>
                  <span class="review-date">${new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div class="review-content">${review.content}</div>
                ${review.images.length > 0 ? `<div class="review-images">${reviewImgHTML}</div>` : ''}
                ${replyHTML}
              </div>
            `;
          }).join('');

          reviewsListEl.innerHTML = reviewsHTML;
        } else {
          reviewsListEl.innerHTML = '<div style="text-align: center; color: var(--gray-600); padding: 24px;">Bánh này chưa có đánh giá nào. Hãy mua và trở thành người đầu tiên đánh giá!</div>';
        }
      } catch (err) {
        reviewsListEl.innerHTML = '<div style="text-align: center; color: var(--danger);">Không thể tải đánh giá sản phẩm.</div>';
      }
    };

    loadProductDetails();
  }
});

// Quick Add helper from Home/Products catalog page
const quickAddCart = async (productId, size, flavor) => {
  try {
    const data = await fetchAPI('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: 1, size, flavor, note: '' }),
    });

    if (data.success) {
      showToast('Đã thêm bánh vào giỏ hàng thành công!', 'success');
      updateCartBadge();
    }
  } catch (err) {
    if (err.message.includes('đăng nhập')) {
      showToast('Vui lòng đăng nhập tài khoản khách hàng để mua sắm', 'warning');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
    }
  }
};

// Wishlist favorite handler
const toggleFavorite = async (productId) => {
  try {
    const data = await fetchAPI('/api/users/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
    if (data.success) {
      showToast('Đã thêm bánh vào danh sách yêu thích thành công!', 'success');
    }
  } catch (err) {
    if (err.message.includes('đăng nhập') || err.message.includes('token') || err.message.includes('Chưa đăng nhập')) {
      showToast('Vui lòng đăng nhập tài khoản khách hàng để sử dụng danh sách yêu thích', 'warning');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
    } else {
      showToast(err.message, 'danger');
    }
  }
};
