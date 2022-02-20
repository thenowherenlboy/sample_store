const express = require('express');
const router = express.Router();
const Mailgun = require('mailgun-js-sdk');
const Item = require('../models/Item');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const randomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcefghijklmnopqrstuvwxyz0123456789';
  for (i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}


router.get('/', (req, res, next) => {
  const user = req.user;
  if (user == null) {
    res.redirect('/');
    return;
  }

  Item.find(null, (err, items) => {
    if (err)
      return next(err);
    Item.find({interested: user._id}, (err, interestedItems) => {
      if (err)
        return next(err);
      const data = {
        user: user,
        items: items,
        interested: interestedItems
      }
      res.render('account', data);
    });
  });
});
router.get('/removeItem/:itemid', (req, res, next) => {
  const user = req.user;
  if (user == null) {
    res.redirect('/');
    return;
  }
  Item.findById(req.params.itemid, (err, item) => {
    if (err)
      return next(err);
    if (item.interested.indexOf(user._id) > -1) {
      item.interested.pop(user._id);
      item.save();
      res.redirect('/account');
    }
  });
});
router.get('/additem/:itemid', (req, res, next) => {
  const user = req.user;
  if (user == null) {
    res.redirect('/');
    return;
  }

  Item.findById(req.params.itemid, (err, item) => {
    if (err) {
      return next(err);
    }

    if (item.interested.indexOf(user._id) == -1) {
      item.interested.push(user._id);
      item.save();
      res.redirect('/account');
    } else {
      res.redirect('/account');
    }
  });
});
router.get('/logout', (req, res, next) => {
  req.logout();
  res.redirect('/');
});

router.post('/resetpassword', (req, res, next) => {

  User.findOne({email: req.body.email}, (err, user) => {
    if (err)
      return next(err);
    if (user == null) {
      return next(new Error(req.body.email + ' is not registered'));
    }
    user.nonce = randomString(8);
    user.passwordResetTime = new Date();
    user.save();
    const mailgun = new Mailgun({
      apiKey: '0e19e34d84893ef7d14a53860eb27fdc-c250c684-005b2fdd',
      domain: 'sandboxb46e96a0affa47ada0c5221f4c5e0dd3.mailgun.org'
    });
    const data = {
      to: req.body.email,
      from: 'YourSampleStore@localhost.com',
      sender: 'Sample Store',
      subject: 'Password Reset Request',
      html: 'Click <a href="http://localhost:5000/account/passwordreset?nonce=' + user.nonce + '&id=' + user._id + '">HERE</a> to reset your password. This link is valid for only 24 hours.'
    };
    mailgun.sendMessage('sandboxb46e96a0affa47ada0c5221f4c5e0dd3.mailgun.org', data);
    res.json({
      confirmation: 'success',
      data: 'reset password endpoint',
      user: user
    });
  });
});

router.get('/passwordreset', (req, res, next) => {
  const nonce = req.query.nonce;
  if (nonce == null)
    return next(new Error('Invalid Request.'));
  const user_id = req.query.id;
  if (user_id == null)
    return next(new Error('Invalid Request.'));
  User.findById(user_id, (err, user) => {
    if ((err) || user.nonce == null || user.passwordResetTime == null) {
      return next(new Error('Invalid Request.'));
    }
    if (nonce != user.nonce)
      return next(new Error('Invalid Request.'));
    var now = Date.now();
    var diff = now - user.passwordResetTime;
    var seconds = diff / 1000;
    if (seconds > (24 * 60 * 60)) {
      return next(new Error('Nonce token expired. Please submit a new password reset request'));
    }

    //reset password
    const data = {
      id: user_id,
      nonce: nonce
    }
    res.render('passwordreset', data);
  });
});
router.post('/newpassword', (req, res, next) => {
  const pw1 = req.body.password1;
  const pw2 = req.body.password2;
  const nonce = req.body.nonce;
  const id = req.body.id;
  if (pw1 == null || pw2 == null || nonce == null || id == null) {
    return next(new Error('Invalid request.'));
  }

  if (pw1 !== pw2)
    return next(new Error('Passwords do not match'));
  User.findById(id, (err, user) => {
    if ((err) || user.nonce == null || user.passwordResetTime == null) {
      return next(new Error('Invalid Request.'));
    }
    if (nonce != user.nonce)
      return next(new Error('Invalid Request.'));
    const hashedPw = bcrypt.hashSync(pw1, 10);
    user.password = hashedPw;
    user.nonce = null;
    user.passwordResetTime = null;
    user.save();
    res.redirect('/');
  });
});
module.exports = router;