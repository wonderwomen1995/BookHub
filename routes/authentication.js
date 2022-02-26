var dotenv=require("dotenv");
   dotenv.config();
var express= require("express"),
    router = express.Router(),
    passport=require("passport"),
    obj= require("../middleware"),
    User= require("../models/user");
  var Books = require("../models/book");
   var async = require("async");
   var nodemailer = require("nodemailer");
   var crypto = require("crypto");
   var nemail;
    
router.get("/",function(req,res){
    res.redirect("/books");
});

//AUTH ROUTES

router.get("/register",function(req,res){
    res.render("emailverify.ejs");
});

// HANDLE SIGN UP LOGIC
router.post("/register",function(req,res){
  
  var obj=new User({
    email: nemail,
    username:req.body.username
  });
  // res.redirect("/login");

   User.register(obj, req.body.password, function(err, user){
  if(err){
      //console.log(err);
      if(err.message!=="A user with the given username is already registered")
      {
        return res.render("register.ejs",{"error":"This email has already existed"});
      }
      return res.render("register.ejs",{"error":err.message});
  } 
  
  passport.authenticate("local")(req,res,function(){
      //res.redirect("/books"); 
      req.flash("success","Welcome to the BookHub " + user.username);
      res.redirect("/books"); 
  });
});
});

// LOGIN ROUTES
//RENDER LOGIN FORM
router.get("/login",function(req,res){
    res.render("login.ejs");
});

//LOGIN LOGIC


// router.post("/login", passport.authenticate("local", {

//     successRedirect: "/books",
//     failureRedirect: "/login"
// }) ,function(req, res){

// });
router.post("/login", function (req, res, next) {
  passport.authenticate("local",
    {
      successRedirect: "/books",
      failureRedirect: "/login",
      failureFlash: "Password/Username doesn't match",
      successFlash: "Welcome to BookHub, " + req.body.username + "!"
    })(req, res);
});
router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged you out");
    res.redirect("/books");
});
//route for forget password
router.get('/forgot', function(req, res) {
  res.render('forgot.ejs');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: process.env.DBEMAIL,
          pass: process.env.DBPASSWORD
        }
        
      });
       var rand=Math.floor((Math.random() * 100) + 54);
  // host=req.get('host');
  // link="http://"+req.get('host')+"/verify?id="+rand;
//  http://' + req.headers.host + '/reset/' + token + '\n\n'


      var mailOptions = {
        to: user.email,
        from: process.env.DBEMAIL,
        subject: 'Book Hub Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        //console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});


router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset.ejs', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: process.env.DBEMAIL,
          pass: process.env.DBPASSWORD
        }
      });
      var mailOptions = {
        to: user.email,
        from: process.env.DBEMAIL,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/books');
  });
});


router.get("/account/:id",obj.isloggedin, function(req, res) {
  User.findById(req.params.id,function(err,founduser){
   if(err){
    req.flash("error","somthing went wrong");
    res.redirect("/")
   }
   Books.find().where("author.id").equals(founduser._id).exec(function(err,foundbook){
    if(err){
    req.flash("error","somthing went wrong");
    res.redirect("/")
   }
   else if(foundbook.length<1){
    req.flash("warning","You Haven't Added Any Book");
    res.redirect("/books")
   }
   else{
   res.render("account.ejs",{user:founduser,book:foundbook});
 }
   //console.log(foundbook.author.email);
   });
  });  
});





//newcode here

var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
       user: process.env.DBEMAIL,
       pass: process.env.DBPASSWORD
    }
});
var rand,mailOptions,host,link;
/*------------------SMTP Over-----------------------------*/

/*------------------Routing Started ------------------------*/


router.get('/send',function(req,res){
  rand=Math.floor((Math.random() * 100) + 54);
  host=req.get('host');
  link="http://"+req.get('host')+"/verify?id="+rand;
  mailOptions={
    to : req.query.to,
    subject : "Please confirm your Email account",
    html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>" 
  }
  console.log("link:"+link);
  console.log(req.query.to);
  //console.log(mailOptions);
  smtpTransport.sendMail(mailOptions, function(error, response){
     if(error){
          console.log(error);
    res.end("error");
   }else{
          console.log("Message sent: " + response.message);
    res.end("sent");
       }
});
});

router.get('/verify',function(req,res){
console.log(req.protocol+":/"+req.get('host'));
if((req.protocol+"://"+req.get('host'))==("http://"+host))
{
  console.log("Domain is matched. Information is from Authentic email");
  if(req.query.id==rand)
  {
    console.log("email is verified");
    nemail=mailOptions.to;
    res.render('register.ejs',{email:nemail});
    //res.end("<h1>Email "+mailOptions.to+" is been Successfully verified");
  }
  else
  {
    console.log("email is not verified");
    res.end("<h1>Bad Request</h1>");
  }
}
else
{
  res.end("<h1>Request is from unknown source");
}
});

/*--------------------Routing Over----------------------------*/






module.exports= router;
