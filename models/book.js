var mongoose=require("mongoose");
//  BOOK SCHEMA SETUP

var bookschema = new mongoose.Schema({
    name:String,    
    edition:String,
    writer:String,
    price:String,
    image:[String],
    imageId:[String],
    description:String,
    contact:String,    
    created:{type:Date, default:Date.now},
    author:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user"
        },
        username:String,
        email:String
    },
    comments:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"comment"
    }
    ] 
});
module.exports = mongoose.model("book",bookschema);