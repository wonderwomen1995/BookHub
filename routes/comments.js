var express= require("express"),
    router = express.Router({mergeParams:true}),
    Books= require("../models/book"),
    Comments= require("../models/comment");
 var obj= require("../middleware");

// COMMENTS ROUTE

router.get("/new",obj.isloggedin,function(req,res){
    
    Books.findById(req.params.id,function(err,item){
       if(err){
           console.log(err);
       } 
       else{
           res.render("comments/new.ejs",{book:item});
       }
    });
});
router.post("/",obj.isloggedin,function(req,res){
  Books.findById(req.params.id,function(err,book){
      if(err){
          console.log(err);
          res.redirect("/books");
      } 
      else{
        console.log(req.body.text);
        var comment={
          text:req.body.text
        }
        console.log(comment);
          Comments.create(comment,function(err,comment){
             if(err){
              req.flash("error","something went wrong");
                 console.log(err);
             } 
             else{
              comment.author.id= req.user._id;
                 comment.author.username=req.user.username;
                 //console.log(comment);
                 comment.save();
                  book.comments.push(comment._id);
                  book.save();
                  //console.log(book);
                   req.flash("success","You have added a comment");
                   res.redirect("/books/"+ book._id);
             }
          });
      }
  });
});

//EDIT ROUTE
router.get("/:comment_id/edit", obj.isloggedin, obj.checkcommentAuthorization, function(req,res){
    //res.render("comments/edit");
     Comments.findById(req.params.comment_id,function(err,founditem){
        if(err){
            res.redirect("back");
        }
        else{
            //console.log(founditem);
            res.render("comments/edit.ejs",{book_id:req.params.id, comment:founditem});
        }
    });
});

//UPDATE ROUTE

router.put("/:comment_id", obj.checkcommentAuthorization, function(req,res){
    //res.send("updated comment");
    var comment={
      text:req.body.text
    }
    Comments.findByIdAndUpdate(req.params.comment_id ,comment,function(err,founditem){
        if(err){
            res.redirect("back");
        }
        else{
            //console.log(founditem);
            res.redirect("/books/" + req.params.id);
        }
    });
});

// DELETE ROUTE

router.delete("/:comment_id", obj.checkcommentAuthorization, function(req,res){
    Comments.findByIdAndRemove(req.params.comment_id,function(err){
        if(err){
            res.redirect("back");
        }
        else{
            req.flash("success","Comment deleted");
            res.redirect("/books/" + req.params.id);
        }
    });
});






module.exports= router;
