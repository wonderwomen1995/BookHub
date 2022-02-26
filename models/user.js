var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");
var userschema= new mongoose.Schema({
    username:{type:String,unique:true,required:true},
    password:String,
    email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    
});
userschema.plugin(passportLocalMongoose);

module.exports= mongoose.model("user",userschema);