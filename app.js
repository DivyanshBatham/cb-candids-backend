const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session'); // used to manage user sessoin
const logger = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
var cors = require('cors')
dotenv.config();

const passportConfig = require('./config/passport-config.js');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const postsRouter = require('./routes/posts');

const app = express();

mongoose.connect(process.env.URI, { useNewUrlParser: true });

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000, // a day,
    keys: [process.env.COOKIE_SECRET] // For encrption of jwt,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname , 'public')));
app.use(express.static(path.join(__dirname , 'uploads')));

// initialize passport
app.use(passport.initialize());
app.use(passport.session()); // If your application uses persistent login sessions i.e. express-session (server side session)

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // TODO: Handle 404 and errors.
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).json({
    "success": false,
    "errors": err.message
  });
});

module.exports = app;
