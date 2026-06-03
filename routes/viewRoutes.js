const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const serveView = (fileName) => {
  return (req, res) => {
    res.sendFile(path.join(__dirname, '../views', fileName));
  };
};

const protectView = (allowedRoles = []) => {
  return async (req, res, next) => {
    let token;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.redirect('/login.html');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || user.status === 'blocked') {
        res.clearCookie('token');
        return res.redirect('/login.html');
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        if (user.role === 'admin') {
          return res.redirect('/admin-dashboard.html');
        } else if (user.role === 'staff') {
          return res.redirect('/staff-dashboard.html');
        } else {
          return res.redirect('/user-dashboard.html');
        }
      }

      req.user = user;
      next();
    } catch (error) {
      res.clearCookie('token');
      return res.redirect('/login.html');
    }
  };
};

// Map each HTML route
router.get('/', serveView('index.html'));
router.get('/index.html', serveView('index.html'));
router.get('/login.html', serveView('login.html'));
router.get('/register.html', serveView('register.html'));
router.get('/forgot-password.html', serveView('forgot-password.html'));
router.get('/products.html', serveView('products.html'));
router.get('/product-detail.html', serveView('product-detail.html'));
router.get('/cart.html', serveView('cart.html'));
router.get('/checkout.html', serveView('checkout.html'));
router.get('/order-tracking.html', serveView('order-tracking.html'));
router.get('/contact.html', serveView('contact.html'));
router.get('/teabreak.html', serveView('teabreak.html'));
router.get('/custom-cake.html', serveView('teabreak.html'));

// Protected dashboard routes
router.get('/user-dashboard.html', protectView(['user', 'staff', 'admin']), serveView('user-dashboard.html'));
router.get('/staff-dashboard.html', protectView(['staff', 'admin']), serveView('staff-dashboard.html'));
router.get('/admin-dashboard.html', protectView(['admin']), serveView('admin-dashboard.html'));

module.exports = router;
