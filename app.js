const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');

const bodyParser = require('body-parser');
const {body, validationResult,check} = require('express-validator');
const cookieSession = require('cookie-session');
const app = express();
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const contactUsRouter = require('./routes/contactus');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/login',usersRouter);
app.use('/register',usersRouter);
app.use('/profile',usersRouter);
app.use('/contactus',contactUsRouter);

app.use(cookieSession({
    name: "session",
    keys: ['key1','key2'],
    maxAge: 3600 * 1000
}))
let connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: "password",
  database: 'almaweb'
});
connection.connect((err)=>{
  if(err) throw err;
  console.log("connected");
});


app.post('/register',
    body('email',"Email is Empty").isEmail().custom((value)=>{
        let sql = `SELECT email from register_tb WHERE email='`+value+`'`;
        return connection.query(sql,(err,result)=>{
            if(err) throw err;
            if(result.length > 0){
                return Promise.reject("This email is already used!");
            }
            return true;
        })
    }),
    body('username',"Username is Empty").trim().not().isEmpty(),
    body('password',"Password must be of minimum length 6 character").trim().isLength({min:6}),
    (req,res,next)=>{
    const error = validationResult(req);
    const errorMessages = [];
        if(error.isEmpty()) {
            error.array().map(err => errorMessages.push({[err.param]: err.msg}));
            if (!error.isEmpty()) {
                console.log(errorMessages.forEach(err => {
                    console.log(err);
                    return res.status(200).render('register', {eMsg: errorMessages, title: "Register"});
                }));
            }
            const {username, email, password} = req.body;
            bcrypt.hash(password,12).then(hash_pass =>{
                let sql = "INSERT INTO register_tb (username,email,password) values ('" + username + "',' " + email + " ','" + hash_pass + "')";
                connection.query(sql, (err, result) => {
                    if (err) throw err;
                    console.log("Record inserted");
                });
                return res.status(400).json({msg: `Your Account is Created Successfully, Now you can <a href='/login'></a>`});
            });

        }else{
            res.render('/login',{title:"Login",eMsg:' '});
        }
});

app.post('/login',
    body('email','Email is empty').isEmail().not().custom(value=>{
        let sql = `SELECT email from register_tb where email='`+ value+`'`;
        connection.query(sql,(err,result)=>{
            if (err) throw err;
            if(result.length > 0){
                return true;
            }else
                return Promise.reject("Invalid email or user not found");
        })
    }),
    body('password',"Please Enter valid password").trim().isEmpty().not(),
    (req,res)=>{
        const validation_result = validationResult(req);
        const {email,password} = req.body;
        if(validation_result.isEmpty()){
            const sql = `SELECT * FROM register_tb WHERE email='`+email+`'`;
            connection.query(sql,(err,result)=>{
                if(err) throw err;
                bcrypt.compare(password,result[0].password).then(compare_result=>{
                   if(compare_result===true){
                        req.session.isLoggedIn = true;
                        req.session.userID = result[0].id;
                        res.render('profile1',{title:'profile',userInfo:result});
                   }else{
                       res.render('/login',{title:"Login",passwordError:'Invalid Password'});
                   }
                });
            });
        }
});
app.use('/logout',(req,res)=>{
   res.render("index",{title:"Home"});
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
