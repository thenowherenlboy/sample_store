const express = require('express');
const User = require('../models/User');
const passport = require('passport');
const router = express.Router();

router.post('/', passport.authenticate('localLogin', {
  successRedirect: '/account'
}));
module.exports = router;