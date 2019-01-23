var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var passport    = require('passport');
var LocalStrategy  = require('passport-local');
var methodOverride = require('method-override');

var User = require('./public/models/user');

mongoose.connect(mongodatabaselink_here, { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Passport configuration
app.use(require('express-session')({
    secret: 'Stars are big balls of gass.',
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
    next();
});

// SCHEMA setup
var universeSchema = new mongoose.Schema({
    name: String,
    distance: String,
    description: String,
    image: String
});

var Star = mongoose.model('Star', universeSchema);

app.listen(process.env.PORT || 3000);

// ROOT ROUTE
app.get('/', function(req, res) {
    res.render("landing");
});

// SHOW EVERY ITEM FROM DATABASE
app.get('/stars', function(req, res) {
    Star.find({}, function(err, allStars){
        if(err){
            console.log('Error Occurred:' + err);
        } else {
            res.render('index', {stars:allStars});
        }
    });
});

// CREATE ROUTE
app.post('/stars', function(req, res){

    // get data from form
    var name = req.body.name;
    var image = req.body.image;
    var distance = req.body.distance;
    var desc = req.body.description;
    var newStar = {name: name, image: image, distance: distance, description: desc}

    // Create a new star and save to database
    Star.create(newStar, function(err, newlyCreated) {
        if(err) {
            console.log(err);
        } else {
            // redirect back to 'stars' page
            res.redirect('/stars');
        }
    });
});

// NEW ROUTE
app.get('/stars/new', function(req, res){
    res.render('new');
});

// SHOW ROUTE
app.get('/stars/:id', function(req, res){
    // find the star with provided id
    Star.findById(req.params.id, function(err, foundStar){
        if(err){
            console.log(err);
        } else {
            // render 'show' page
            res.render('show', {stars: foundStar});
        }
    });
});

// EDIT ROUTE
app.get('/stars/:id/edit', isLoggedIn, function(req, res){
    Star.findById(req.params.id, function(err, foundStar){
        if(err){
            res.redirect('/stars');
        } else {
            res.render('edit', {stars: foundStar});
        }
    });
});

// UPDATE ROUTE
app.put('/stars/:id', function(req, res){
    Star.findByIdAndUpdate(req.params.id,
        {$set:{'name':req.body.name, 'image':req.body.image, 'distance':req.body.distance, 'description':req.body.description}},
        function(err, updatedStar){
            if(err){
                res.redirect("/stars");
                console.log(err);
            } else {
                res.redirect("/stars/" + req.params.id);
            }
    });
});

// DELETE ROUTE
app.delete('/stars/:id', function(req, res){
    Star.findByIdAndRemove(req.params.id, function(err){
        if(err) {
            res.redirect('/stars');
            console.log(err);
        } else {
            res.redirect('/stars');
        }
    });
});

// AUTH ROUTES
// show register form
app.get('/register', function(req,res){
    res.render('register');
})
// handle sing up logic
app.post('/register', function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render('register');
        }
        passport.authenticate('local')(req, res, function(){
            res.redirect('/stars');
        });
    });
});
// show login form
app.get('/admin', function(req, res){
    res.render('login');
});
// handling login logic
app.post('/login', passport.authenticate('local',
    {
        successRedirect: '/stars',
        failureRedirect: '/admin'
    }), function(req, res){
});
// logout logic
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/stars');
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/admin');
}
