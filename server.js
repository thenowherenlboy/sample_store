const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const hogan = require('hogan-express');

const auth = require('./config/auth')(passport);
const home = require('./routes/home');
const register = require('./routes/register');
const login = require('./routes/login');
const account = require('./routes/account');
const admin = require('./routes/admin');


mongoose.connect('mongodb://localhost/sample-store', (err, data) => {
  if (err) {
    console.log('Database connection failed');
    return;
  }
  console.log('Database connected');
});
const app = express();
app.engine('html', hogan);
app.set('partials',{navbar:'navbar'});
app.use(session({
  secret: 'whatth3wh@t',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'public')));
app.use('/', home);
app.use('/register', register);
app.use('/login', login);
app.use('/account', account);
app.use('/admin', admin);

app.use((err, req, res, next) => {
  res.render('error', {message: err.message});
});
app.listen(5000);
console.log('App running on http://localhost:5000');

