var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var mongoose = require('mongoose');
var Blogpost = require("./models/blogpost");
//var Comment = require("./models/comment");
//var User = require("./models/user");
mongoose.connect("mongodb://localhost/sceptechBlog");

/*
Blogpost.create(
  {title: "Youtube: combating hate by demonitising and limiting free speech",
  image: "http://3.bp.blogspot.com/-i8BMavi_azo/VpLcf_mUiyI/AAAAAAAAPY4/hwvmRjbDFx8/s1600/airplane-screenshot.jpg"},
  function(err, blogpost){
    if(err){
      console.log(err);
    }else{
      console.log('newly created blogpost');
      console.log(blogpost);
    }
  }
);
*/
//in order for the header.ejs to access the CSS/icons, you need to declare it as a static file here
app.use(express.static(__dirname + '/public/stylesheets'));
app.use(express.static(__dirname + '/public/images'));
//standard way to init bodyParser
app.use(bodyParser.urlencoded({extended: true}));
//in order to use PUT or DELETE requests as routers in this app, use method override. otherwise just put app.post (.ejs would still require ?_method=PUT/DELETE etc)
app.use(methodOverride('_method'));
//in order to leave off ejs
app.set('view engine', 'ejs');

/*
var blogPosts = [
  {title: "The tracker in your pocket", image: "https://noveltystreet.com/wp-content/uploads/2014/06/Tagg-Dog-Cat-Pet-Tracker-Stylish-Design-Poster-Promo.jpg"},
  {title: "Do we need encryption?", image: "http://i1.mirror.co.uk/incoming/article9000618.ece/ALTERNATES/s615/JS101475774.jpg"},
  {title: "Youtube: combating hate by demonitising and limiting free speech", image: "http://3.bp.blogspot.com/-i8BMavi_azo/VpLcf_mUiyI/AAAAAAAAPY4/hwvmRjbDFx8/s1600/airplane-screenshot.jpg"}
];
*/

app.get('/index', function(req, res){
//{1, 2} 1 is the name of the object and 2 is the object and data being passed in
  Blogpost.find({}, function(err, allBlogPosts){
    if(err){
      console.log(err);
    }else{
      res.render('index', {blogPosts: allBlogPosts});
    }
  });
});

app.post('/index', function(req, res){
  //connect to html input form via name
  var title = req.body.title;
  var image = req.body.image;
  var desc = req.body.description;
  var newBlogPost = {title: title, image: image, description: desc};

  //blogPosts.push(newBlogPost);
  Blogpost.create(newBlogPost, function(err, newlyCreated){
    if(err){
      console.log(err);
    }else{
      //update server then get() will relod new page
      res.redirect('/index');
    }
  });
});

app.get('/index/new', function(req, res){
  res.render('new');
});

app.get('/index/:id', function(req, res){
  Blogpost.findById(req.params.id, function(err, foundBlogpost){
    if(err){
      console.log(err);
    }else{
      res.render("show", {blogPost: foundBlogpost});
    }
  });
});

//edit
app.get('/index/:id/edit', function(req, res){
  Blogpost.findById(req.params.id, function(err, foundBlogpost){
    if(err){
      res.redirect('/index');
    }else{
        res.render('edit', {blogPost: foundBlogpost});
    }
  });
});

//update
app.put('/index/:id', function(req, res){
  //find id, then info in var fields and once updated redirect
  Blogpost.findByIdAndUpdate(req.params.id, req.body.blogPost, function(err, updatedBlogpost){
    if(err){
      res.redirect('/index');
    }else{
      res.redirect('/index/' + req.params.id);
    }
  });
});

//DELETE via post
app.delete('/index/:id', function(req, res){
  //res.send("destroyed");
  Blogpost.findByIdAndRemove(req.params.id, function(err){
    if(err){
      res.redirect("/index");
    }else{
      res.redirect("/index");
    }
  });
});

app.listen(process.env.PORT || 3000, function(){
  console.log('blogApp is now running');
});
