var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    expressSanitizer = require('express-sanitizer'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    methodOverride = require('method-override'),
    flash = require('connect-flash'),
    Blogpost = require('./models/blogpost'),
    Comment = require('./models/comment'),
    User = require('./models/user');

mongoose.connect('mongodb://localhost/sceptechBlog');

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
app.use(expressSanitizer());
app.use(methodOverride('_method'));
app.use(flash());
//in order to leave off ejs
app.set('view engine', 'ejs');

/*
var blogPosts = [
  {title: "The tracker in your pocket", image: "https://noveltystreet.com/wp-content/uploads/2014/06/Tagg-Dog-Cat-Pet-Tracker-Stylish-Design-Poster-Promo.jpg"},
  {title: "Do we need encryption?", image: "http://i1.mirror.co.uk/incoming/article9000618.ece/ALTERNATES/s615/JS101475774.jpg"},
  {title: "Youtube: combating hate by demonitising and limiting free speech", image: "http://3.bp.blogspot.com/-i8BMavi_azo/VpLcf_mUiyI/AAAAAAAAPY4/hwvmRjbDFx8/s1600/airplane-screenshot.jpg"}
];
*/

//passport configuration
app.use(require('express-session')({
  secret: "who wins this?!",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

//routes

app.get('/index', function(req, res){
//{1, 2} 1 is the name of the object and 2 is the object and data being passed in
  Blogpost.find({}, function(err, allBlogPosts){
    if(err){
      console.log(err);
    }else{
      res.render('blogposts/index', {blogPosts: allBlogPosts, currentUser: req.user});
    }
  });
});

app.post('/index', function(req, res){
  //connect to html input form via name
  var title = req.body.title;
  var image = req.body.image;
  var desc = req.sanitize(req.body.description);
  var auth = req.body.author;
  var newBlogPost = {title: title, image: image, description: desc, author: auth};

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

app.get('/index/new', isLoggedIn, function(req, res){
  res.render('blogposts/new');
});

app.get('/index/:id', function(req, res){
  Blogpost.findById(req.params.id).populate("comments").exec(function(err, foundBlogpost){
    if(err){
      console.log(err);
    }else{
      console.log(foundBlogpost);
      res.render('blogposts/show', {blogPost: foundBlogpost});
    }
  });
});

//edit
app.get('/index/:id/edit', isLoggedIn, function(req, res){
  Blogpost.findById(req.params.id, function(err, foundBlogpost){
    if(err){
      res.redirect('/index');
    }else{
        res.render('blogposts/edit', {blogpost: foundBlogpost});
    }
  });
});

//update
app.put('/index/:id', isLoggedIn, function(req, res){
  //sanitize blogpost.description before updating the whole entire blog
  req.body.blogpost.description = req.sanitize(req.body.blogpost.description);
  //find id, then info in var fields and once updated redirect
  Blogpost.findByIdAndUpdate(req.params.id, req.body.blogpost, function(err, updatedBlogpost){
    if(err){
      req.flash('error', err.message);
      res.redirect('/index');
    }else{
      res.redirect('/index/' + req.params.id);
    }
  });
});

//DELETE via post
app.delete('/index/:id', isLoggedIn, function(req, res){
  //res.send("destroyed");
  Blogpost.findByIdAndRemove(req.params.id, function(err){
    if(err){
      res.redirect('/index');
    }else{
      res.redirect('/index');
    }
  });
});

// COMMENTS ROUTES

app.get('/index/:id/comments/new', isLoggedIn, function(req, res){
  Blogpost.findById(req.params.id, function(err, blogpost){
    if(err){
      console.log(err);
    }else{
      //blogpost = to blogpost coming back from db to be passed into comments/new.ejs file
      res.render('comments/new', {blogpost: blogpost});
    }
  });
});

app.post('/index/:id/comments', isLoggedIn, function(req, res){
  //find blogpost
  Blogpost.findById(req.params.id, function(err, blogpost){
    if(err){
      console.log(err);
      res.redirect('/index');
    }else{
      Comment.create(req.body.comment, function(err, comment){
        if(err){
          console.log(err);
        }else{
          //add username and id to comment using comment schema model
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          comment.save();
          blogpost.comments.push(comment);
          blogpost.save();
          res.redirect('/index/' + blogpost._id);
        }
      });
    }
  })
});

//comment/edit

app.get('/index/:id/comments/:comment_id/edit', checkCommentOwnership, function(req, res){
  Comment.findById(req.params.comment_id, function(err, foundComment){
    if(err){
      res.redirect('back');
    }else{
      res.render('comments/edit', {blogPost_id: req.params.id, comment: foundComment});
    }
  });
});

//comment/update
app.put('/index/:id/comments/:comment_id', checkCommentOwnership, function(req, res){
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
    if(err){
      res.redirect('back');
    }else{
      res.redirect('/index/'+req.params.id);
    }
  });
});

app.delete('/index/:id/comments/:comment_id', checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
    if(err){
      res.redirect('back');
    } else {
      res.redirect('/index/'+ req.params.id);
    }
  });
});

//authentication ROUTES

app.get('/register', function(req, res){
  res.render('users/register');
});

app.post('/register', function(req, res){
  var newUser = new User({username: req.body.username});
  User.register(newUser, req.body.password, function(err, newuser){
    if(err){
      req.flash('error', err.message);
      return res.render('users/register');
    }
    passport.authenticate('local')(req, res, function(){
      req.flash('success', 'You have registered as: ' + newUser.username);
      res.redirect('/index');
    });
  });
});

//login form
app.get('/login', function(req, res){
  res.render('users/login');
});

//req, middleware then callback
app.post('/login', passport.authenticate('local',
{
  successRedirect: '/index',
  failureRedirect: '/login'
}),function(req, res){
  //res.send('login logic happens here');
});

//logout
app.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You have successfully logged out!');
  res.redirect('/index');
});

//middleware

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
    req.flash('error', 'You need to be logged in in order to do that.');
    res.redirect('/login');
}

function checkCommentOwnership(req, res, next){
  if(req.isAuthenticated()){
    Comment.findById(req.params.comment_id, function(err, foundComment){
      if(err){
        req.flash('error', 'Blogpost not found.');
        res.redirect('back');
      }else{
        console.log(foundComment._id);
        if(foundComment._id.equals(req.user._id) || req.user.username === "johnnygogo"){
          next();
        }else{
          req.flash('error', 'You dont have permission to do that.');
          res.redirect('back');
        }
      }
    });
  } else {
    req.flash('error', 'You need to be logged in in order to do that.');
    res.redirect('back');
  }
}

//whataboutery pages

app.get('/about', function(req, res){
  res.render('aboutEtAl/about');
});

app.get('*', function(req, res) {
  res.status(404).render('aboutEtAl/404');
});


app.listen(process.env.PORT || 3000, function(){
  console.log('blogApp is now running');
});
