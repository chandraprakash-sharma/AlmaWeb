let express = require('express');
let router = express.Router();

let app = express();
// let connection = mysql.createConnection({
//   host: 'localhost',
//   port: 3306,
//   user: 'root',
//   password: "password",
//   database: 'almaweb'
// });
// connection.connect();
/* GET login page. */
router.get('/register', function(req, res) {
  res.render('register', { title: 'Register',eMsg:''});
});
router.get('/login', (req, res) =>{
  res.render('login', { title: 'Login' });
});
router.get('/profile',(req,res)=>{
  res.render('profile1',{title:'Profile'});
});

module.exports = router;
