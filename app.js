const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors')

const fileRouter = require('./routes/file/file.router');
const userRouter = require('./routes/onboarding/user.router');
const fileUpload = require('express-fileupload');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

app.use('/file', fileRouter);
app.use('/', userRouter);


app.listen('3000', ()=> console.log('Server started running on port 3000'))