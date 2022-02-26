var dotenv=require("dotenv");
   dotenv.config();
var express= require("express"),
    router = express.Router(),
    Books= require("../models/book"),
    obj= require("../middleware"),
    Comments= require("../models/comment");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name:process.env.CLOUDNAME,  
  api_key:process.env.APIKEY,
  api_secret:process.env.APISECRET
});

// INDEX route
router.get("/",function(req,res){
 if(req.query.search){
  const regex = new RegExp(escapeRegex(req.query.search), 'gi');
     Books.find({name:regex},function(err,item){
    if(err){
        console.log("something went wrong");
    }
    else if(item.length<1){
      req.flash("error","Sorry No Such book exists");
      res.redirect("back");
    }
    else{
        res.render("books/index.ejs",{book:item});
    }
    });
  }
   else{    
     Books.find({},function(err,item){
    if(err){
        console.log("something went wrong");
    }
    else{
        res.render("books/index.ejs",{book:item});
    }
});
      }
});

// NEW route
router.get("/new",obj.isloggedin,function(req,res){
   res.render("books/new.ejs"); 
});

//  CREATE route
router.post("/", obj.isloggedin, upload.array("book[image]"), async function(req, res) {
    
      req.body.book.author = {
        id: req.user._id,
        username: req.user.username,
        email:req.user.email
      }
      req.body.book.image=[];
    req.body.book.imageId=[];
       for (const file of req.files) {
        let result = await cloudinary.uploader.upload(file.path);
        req.body.book.image.push(result.secure_url);
       req.body.book.imageId.push(result.public_id);
    }    
      
      Books.create(req.body.book, function(err, book) {
        if (err) {
          //req.flash('error', err.message);
          return res.redirect('back');
        }
        //console.log(book);
        res.redirect('/books/'+book.id);
      });
    });




// SHOW route-- shows more info about one book

router.get("/:id", function(req, res){
    
    Books.findById(req.params.id).populate("comments").exec(function(err, foundbook){
        if(err||!foundbook){
            req.flash("error","book doesn't exist");
            res.redirect("/books");
        } else {
            //console.log(foundbook);            
            res.render("books/show.ejs", {book: foundbook});
        }
    });
});
// EDIT ROUTE
router.get("/:id/edit",obj.isloggedin, obj.checkbookAuthorization , function(req,res){
    
    //CHECK IF USER IS LOGGED IN
    Books.findById(req.params.id,function(err,founditem){
        if(err){
            res.redirect("back");
        }
        else{
          //console.log(founditem);
            res.render("books/edit.ejs",{book:founditem});
        }
    });
    
});


router.put("/:id", upload.array("book[image]"), function(req, res){
    Books.findById(req.params.id, async function(err, book){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
            //     for (const file of req.files) {
            //   let result = await cloudinary.uploader.upload(file.path);
            //   req.body.book.image.push(result.secure_url);
            //   req.body.book.imageId.push(result.public_id);
            // }
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            console.log(req.files);
            }
            //console.log("============");           
            book.name = req.body.book.name;
            book.description = req.body.book.description;
            book.price=req.body.book.price;
            book.edition=req.body.book.edition;
            book.writer=req.body.book.writer;
            book.contact=req.body.book.contact;
            //book.email=req.body.book.email;
            //console.log(book);
            //console.log(req.body.book.name+" "+req.body.book.description+" "+req.body.book.price);
            book.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/books/" + book._id);
        }
    });
});

router.delete('/:id', function(req, res) {
  Books.findById(req.params.id,  function(err, book) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
      book.imageId.forEach(async function (abc){
        await cloudinary.v2.uploader.destroy(abc);
      });
        //book.comments.remove();
        book.comments.forEach(function(el){
          Comments.findByIdAndRemove(el,function(err){
          if(err){
            res.redirect("back");
        }
       });
        });
        book.remove();
        req.flash('success', 'book deleted successfully!');
        res.redirect('/books');
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});

router.get("/account",function(req,res){
  res.send("user acoount");
});


// FOR FUZZY SEARCHING
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports= router;

