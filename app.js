const express = require('express');
const bodyParser = require('body-parser');
const staticAsset = require('static-asset');
const path = require('path');

//database
const config = require('./config');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.set('debug', config.IS_PRODUCTION);

mongoose.connection
  .on('error', error => console.log(error))
  .on('close', () => console.log * 'Database connedction closed.')
  .once('open', () => {
    const info = mongoose.connections[0];
    console.log(`Connected to ${info.host}:${info.port}/${info.name}`);
  });

mongoose.connect(
  config.MONGO_URL,
  {
    useNewUrlParser: true,
    auth: {
      user: config.user,
      password: config.password
    }
  }
);

//express
const app = express();

//sets and uses
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extend: true }));
app.use(staticAsset(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//jQuery
app.use(express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));

//routers
app.get('/', (req, res) => {
  res.render('index');
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.render('error', {
    message: error.message,
    error: !config.IS_PRODUCTION ? error : {}
  });
});

app.listen(config.PORT, () =>
  console.log(`Example app listening on port ${config.PORT}!`)
);
