var dotenv = require('dotenv')
dotenv.config()
var express = require('express'),
  app = express(),
  bodyparser = require('body-parser'),
  Books = require('./models/book'),
  Comments = require('./models/comment'),
  User = require('./models/user'),
  passport = require('passport'),
  localstrategy = require('passport-local'),
  mongoose = require('mongoose'),
  methodoverride = require('method-override'),
  flash = require('connect-flash')

app.locals.moment = require('moment')

//Requiring Routes
var commentroutes = require('./routes/comments'),
  bookroutes = require('./routes/books'),
  authroutes = require('./routes/authentication')

//seedDB();
//"mongodb://localhost/store"||
var url = process.env.DATABASEURL || 'mongodb://localhost/store'
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB Connected…')
  })
  .catch((err) => console.log(err))

app.use(bodyparser.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/public'))
app.use(methodoverride('_method'))
app.use(flash())

//PASSPORT CONFIGURATION
app.use(
  require('express-session')({
    secret: 'life is a game',
    resave: false,
    saveUninitialized: false,
  })
)
app.use(passport.initialize())
app.use(passport.session())

passport.use(new localstrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

//MIDDLEWARE TO ACCESS USER INFORMATION

app.use(function (req, res, next) {
  //console.log(res.locals.currentUser);
  res.locals.currentUser = req.user
  //console.log(res.locals.currentUser);
  res.locals.error = req.flash('error')
  res.locals.success = req.flash('success')
  res.locals.warning = req.flash('warning')
  //console.log(res.locals.currentUser);
  next()
})

app.use('/books/:id/comments', commentroutes)
app.use('/books', bookroutes)
app.use(authroutes)

// app.get("/search",function(req,res){
//     Books.findOne({name:req.query.search},function(err,foundbook){
//        // console.log(foundbook);
//         if(err){
//             req.flash("error","Server problem.");
//             res.redirect("back");
//         }else{
//             if(!foundbook){
//                 //console("nothing found");
//                 req.flash("error","Sorry No Such book exists");
//                 res.redirect("back");
//             }else{
//                 //console.log(foundbook._id);
//             res.redirect("/books/"+foundbook._id);
//         }
//         }
//     });
// });

app.listen(process.env.PORT || 3000, function () {
  console.log('server has started')
})
