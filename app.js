const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false, 
    saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(MONGO_URL + "/blogMastersDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,

});

const postSchema = new mongoose.Schema({
    name: String,
    username: String,
    email:String,
    password: String,
    title: String,
    description:String,
    date: {
        type: Date,
        default: Date.now
    }
});

postSchema.plugin(passportLocalMongoose);

const Post = new mongoose.model("Post",postSchema);

passport.use(Post.createStrategy());
 
// passport.serializeUser(Post.serializeUser());
// passport.deserializeUser(Post.deserializeUser());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
const email = "email";
app.get("/", (req,res) => {
    Post.find({title:{$ne:null}}, function(err,posts){
        res.render("home",{posts:posts,email:email});

    });
});


app.get("/newPost/:email", (req,res) => { 
      
    res.render("newPost",{email:req.params.email});
    
});
app.post("/newPost/:email", (req,res) => {

    Post.find({email: req.params.email, name:{$ne:null}}, function(err,user){
    
    const post = new Post({
        name: user[0].name,
        username: req.params.email,
        title: req.body.postTitle,
        description: req.body.postDescription,
        date: new Date()

 });
    

    post.save((err) => {
       if (err)
            console.log(err);
        else
            res.redirect("/dashboard");

    });
});
});

app.get("/allArticles", (req,res) => {
    
    Post.find({title:{$ne:null}}, function(err,posts){
        res.render("allArticles",{posts:posts});
    });

});

app.get("/dashboard", (req,res) => {
    if(req.isAuthenticated()){

        Post.find({email: req.user.username, name:{$ne:null}}, function(err,user){

            Post.find({username: req.user.username, title:{$ne:null}}, function(err,posts){
            res.render("dashboard",{posts:posts, email: req.user.username, name: user[0].name});       
        });
    });
        
    } else {
        res.redirect("/login"); 
        }
});

app.get("/editPost/:postId", async(req,res) => {
    const post = await Post.findById(req.params.postId);
    res.render("editPost", {post:post});
});

app.delete("/delete/:postId", async(req,res) => {
    await Post.findByIdAndDelete(req.params.postId);
    res.redirect("/dashboard");
});

app.put("/editPost/:postId", (req,res) => {
    Post.updateOne(
        {_id: req.params.postId },
        {"$set":{
         description: req.body.postDescription,
         title: req.body.postTitle,
         date: new Date()
        }},
        
        function(err){
            if(!err)
                res.redirect("/dashboard");
            else
            console.log(err);
        }

    );
});

app.get("/showPost/:postId", (req,res) => {
    Post.findById(req.params.postId, function(err, post){
        res.render("showPost", {post:post});
    });
});


app.get("/login", (req,res) => {
    if(req.isAuthenticated()){
    res.redirect("/dashboard");
    }
    else {
        res.render("login");
    }
});

app.get("/logout", (req,res) => {
    req.logout();
    res.redirect("/");
});

app.get("/alert-register", (req,res) => {
    res.render("alert-register");
});


app.post("/register", function(req,res){
    const registerUser = new Post({
        name: req.body.name,
        email: req.body.username
    });
    registerUser.save();

    Post.register({username: req.body.username}, req.body.password, function(err, user){
        if(err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/dashboard");
            });
        }
        
    });

});

app.post("/login", function(req, res){
    
    const user = new Post({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err) {
            console.log(err);
            
        } else {
            passport.authenticate("local")(req, res, function(){
                
                res.redirect("/dashboard");
             });
  }
    });

});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
    console.log("Server started successfully");
});