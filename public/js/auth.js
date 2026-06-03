// Auth functions
document.addEventListener('DOMContentLoaded', () => {
  // Login Form handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const data = await fetchAPI('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (data.success) {
          showToast(data.message, 'success');
          
          // Redirect based on role
          setTimeout(() => {
            const role = data.user.role;
            if (role === 'admin') {
              window.location.href = '/admin-dashboard.html';
            } else if (role === 'staff') {
              window.location.href = '/staff-dashboard.html';
            } else {
              window.location.href = '/user-dashboard.html';
            }
          }, 1000);
        }
      } catch (err) {}
    });
  }

  // Register Form handler
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const phone = document.getElementById('register-phone').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;
      const address = document.getElementById('register-address').value;

      if (password !== confirmPassword) {
        showToast('Mật khẩu nhập lại không khớp!', 'warning');
        return;
      }

      try {
        const data = await fetchAPI('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, phone, password, address }),
        });

        if (data.success) {
          showToast(data.message, 'success');
          setTimeout(() => {
            window.location.href = '/user-dashboard.html';
          }, 1000);
        }
      } catch (err) {}
    });
  }

  // Forgot Password Form handler
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    const requestOtpBtn = document.getElementById('request-otp-btn');
    const resetArea = document.getElementById('reset-area');
    const requestArea = document.getElementById('request-area');

    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('forgot-email').value;
      const otp = document.getElementById('reset-otp')?.value;
      const newPassword = document.getElementById('reset-new-password')?.value;

      // If resetArea is visible, perform final password reset
      if (resetArea && resetArea.style.display === 'block') {
        try {
          const data = await fetchAPI('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, otp, newPassword }),
          });
          if (data.success) {
            showToast(data.message, 'success');
            setTimeout(() => {
              window.location.href = '/login.html';
            }, 1500);
          }
        } catch (e) {}
      } else {
        // Just request OTP simulation
        try {
          const data = await fetchAPI('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
          });
          if (data.success) {
            showToast(data.message, 'success');
            // Show OTP section
            if (resetArea && requestArea) {
              requestArea.style.display = 'none';
              resetArea.style.display = 'block';
            }
          }
        } catch (e) {}
      }
    });
  }
});
