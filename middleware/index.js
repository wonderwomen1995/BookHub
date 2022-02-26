// ALL THE MIDDLEWARE GOES HERE

var Comments= require("../models/comment");
var Books= require("../models/book");

var middlewareobj={};

//MIDDLEWARE FOR NOT ADDING NEW BOOK

middlewareobj.isloggedin=function(req, res, next){
   if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","Please login first.");
    res.redirect("/login");
}
//MIDDLEWARE FOR AUTHORIZATION FOR DELETE AND EDIT

middlewareobj.checkbookAuthorization= function(req, res, next){
  //console.log(req.params.id);
    Books.findById(req.params.id, function(err, foundBook){
      if(err || !foundBook){          
          req.flash("error", "Sorry, that Book does not exist!");
          res.redirect("/books");
      } else if(foundBook.author.id.equals(req.user._id) || req.user.isAdmin){
          req.book = foundBook;
          next();
      } else {
          req.flash("error", "You don't have permission to do that!");
          res.redirect('/books/' + req.params.id);
      }
    });
  },
middlewareobj.checkcommentAuthorization=function(req, res, next){
  //console.log(req.params.comment_id);
    Comments.findById(req.params.comment_id, function(err, foundComment){
       if(err || !foundComment){
           //console.log(err);
           //console.log(foundComment);
           req.flash("error", "Sorry, that comment does not exist!");
           res.redirect("/books");
       } else if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
            req.comment = foundComment;
            next();
       } else {
           req.flash("error", "You don't have permission to do that!");
           res.redirect("/books/" + req.params.id);
       }
    });
  }






module.exports= middlewareobj;



