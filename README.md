# Lab6-Passport
CS260 Passport Lab

Authentication is a critical part of almost any application.  Passport allows you to use an authenticaion framework for local database authentication as well as authentication through google, twitter or facebook.  In this lab, you will set up local authentication as shown in [Chapter 26](http://proquest.safaribooksonline.com/book/programming/javascript/9780133844351/vi-building-practical-web-application-components/ch26_html) of the book "Node.js, MongoDB, and AngularJS Web Development".  This lab will have a little different format because we want you to use the style from the book.

The project is organized into the following directory structure:
* ./: Contains the base application files and supporting folders. This is the project root.
* ./node_modules: Created when the NPMs listed above are installed in the system.
* ./controllers: Contains the Express route controllers that provide the interaction between routes and changes to the MongoDB database.
* ./models: Contains the Mongoose model definitions for objects in the database.
* ./static: Contains any static files that need to be sent, such as CSS and AngularJS code.
* ./views: Contains the HTML templates that will be rendered by EJS.

When the user registers, you will create a document in the mongo database that includes the password.  When the user logs in later, you will check to make sure the password is correct.

#1. Create an express project
<pre>
express auth
cd auth
mkdir models
mkdir static
mkdir controllers
mkdir static/css
mkdir static/js
</pre>

#2. Create a schema for your user document.  
Notice that the schema defined implements a unique username as well as email, color, and hashed_password fields. The final line creates the model in Mongoose.  Put this file in models/users_model.js
```javascript
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var UserSchema = new Schema({
    username: { type: String, unique: true },
    email: String,
    color: String,
    hashed_password: String
});
mongoose.model('User', UserSchema);
```
#2. Now implement the Express webserver for the application. 
When you created a project before, this code was in app.js.  The book puts it in a file named "auth_server.js".You should recognize much of the code. The general flow of this code is to first require the necessary modules, connect to the MongoDB database, configure the Express server, and begin listening.
The line "require('./models/users_model.js');" ensures that the User model is registered in Mongoose:

The line "require('./routes')(app);" adds the routes from ./routes.js to the Express server and passes the "app" object to the routes.

The Express configuration code uses the connect-mongo library to register the MongoDB connection as the persistent store for the authenticated sessions. Notice that the connect-mongo store is passed an object with session set to the express-session module instance. Also notice that the db value in the mongoStore instance is set to the mongoose.connection.db database that is already connected.  The session will be passed back to the browser in a cookie and will be sent to the server each time another HTTP request is made.  You can change the port from 3000 to something else if you want to.

```javascript
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var mongoStore = require('connect-mongo')({session: expressSession});
var mongoose = require('mongoose');
require('./models/users_model.js');
var conn = mongoose.connect('mongodb://localhost/myapp');
var app = express();
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession({
  secret: 'SECRET',
  cookie: {maxAge:2628000000},
  resave: true,
  saveUninitialized: true,
  store: new mongoStore({
      mongooseConnection:mongoose.connection
    })
  }));
require('./routes')(app);
app.listen(3000);
```
#3. Now add the routes.js file. 
This file implements the routes necessary to support signup, login, editing, and user deletion. This code also implements static routes that support loading the static files.

Notice that req.session is used frequently throughout the routes code. This is the session created when expressSession() middleware was added in the previous section. Notice the code is called to clean up the existing session data when the user logs out or is deleted "req.session.destroy(function(){});"

The code attaches text strings to the session.msg variable so that they can be added to the template. (This is just for example purpose so that you can see the status of requests on the webpages.)

Notice that the express server will serve static files from the "static" directory.  When the "/" route is accessed, the code will check the cookie to see if there is already a session for the user.  If so, it renders the "views/index.html" file, otherwise it redirects them to the login page at "views/login.html".

```javascript
var crypto = require('crypto');
var express = require('express');
module.exports = function(app) {
  var users = require('./controllers/users_controller');
  app.use('/static', express.static( './static')).
      use('/lib', express.static( '../lib')
  );
  app.get('/', function(req, res){
    if (req.session.user) {
      res.render('index', {username: req.session.username,
                           msg:req.session.msg,
                           color:req.session.color});
    } else {
      req.session.msg = 'Access denied!';
      res.redirect('/login');
    }
  });
  app.get('/user', function(req, res){
    if (req.session.user) {
      res.render('user', {msg:req.session.msg});
    } else {
      req.session.msg = 'Access denied!';
      res.redirect('/login');
    }
  });
  app.get('/signup', function(req, res){
    if(req.session.user){
      res.redirect('/');
    }
    res.render('signup', {msg:req.session.msg});
  });
  app.get('/login',  function(req, res){
    if(req.session.user){
      res.redirect('/');
    }
    res.render('login', {msg:req.session.msg});
  });

  app.get('/logout', function(req, res){
    req.session.destroy(function(){
      res.redirect('/login');
    });
  });
  app.post('/signup', users.signup);
  app.post('/user/update', users.updateUser);
  app.post('/user/delete', users.deleteUser);
  app.post('/login', users.login);
  app.get('/user/profile', users.getUserProfile);
}
```

#4. Now you need to implement the route code to support interaction with the MongoDB model. 
Put it in "controllers/users_conroller.js".
```javascript
var crypto = require('crypto');
var mongoose = require('mongoose'),
    User = mongoose.model('User');
function hashPW(pwd){
  return crypto.createHash('sha256').update(pwd).
         digest('base64').toString();
}
exports.signup = function(req, res){
  console.log("Begin exports.signup");
  var user = new User({username:req.body.username});
  console.log("after new user exports.signup");
  user.set('hashed_password', hashPW(req.body.password));
  console.log("after hashing user exports.signup");
  user.set('email', req.body.email);
  console.log("after email user exports.signup");
  user.save(function(err) {
    console.log("In exports.signup");
    console.log(err);
    if (err){
      res.session.error = err;
      res.redirect('/signup');
    } else {
      req.session.user = user.id;
      req.session.username = user.username;
      req.session.msg = 'Authenticated as ' + user.username;
      res.redirect('/');
    }
  });
};
exports.login = function(req, res){
  User.findOne({ username: req.body.username })
  .exec(function(err, user) {
    if (!user){
      err = 'User Not Found.';
    } else if (user.hashed_password === 
               hashPW(req.body.password.toString())) {
      req.session.regenerate(function(){
        console.log("login");
        console.log(user);
        req.session.user = user.id;
        req.session.username = user.username;
        req.session.msg = 'Authenticated as ' + user.username;
        req.session.color = user.color;
        res.redirect('/');
      });
    }else{
      err = 'Authentication failed.';
    }
    if(err){
      req.session.regenerate(function(){
        req.session.msg = err;
        res.redirect('/login');
      });
    }
  });
};
exports.getUserProfile = function(req, res) {
  User.findOne({ _id: req.session.user })
  .exec(function(err, user) {
    if (!user){
      res.json(404, {err: 'User Not Found.'});
    } else {
      res.json(user);
    }
  });
};
exports.updateUser = function(req, res){
  User.findOne({ _id: req.session.user })
  .exec(function(err, user) {
    user.set('email', req.body.email);
    user.set('color', req.body.color);
    user.save(function(err) {
      if (err){
        res.sessor.error = err;
      } else {
        req.session.msg = 'User Updated.';
        req.session.color = req.body.color;
      }
      res.redirect('/user');
    });
  });
};
exports.deleteUser = function(req, res){
  User.findOne({ _id: req.session.user })
  .exec(function(err, user) {
    if(user){
      user.remove(function(err){
        if (err){
          req.session.msg = err;
        }
        req.session.destroy(function(){
          res.redirect('/login');
        });
      });
    } else{
      req.session.msg = "User Not Found!";
      req.session.destroy(function(){
        res.redirect('/login');
      });
    }
  });
};
```
The logic for the "signup" route first creates a new User object and then adds the email address and hashed password, using the hashPW() function defined in the same file. Then the Mongoose save() method is called on the object to store it in the database. On error, the user is redirected back to the signup page.

If the user saves successfully, the ID created by MongoDB is added as the req.session.user property, and the username is added as the req.session.username. The request is then directed to the index page.  The req.session information is passed back and forth using cookies.

The logic for the "login" route finds the user by username, then it compares the stored hashed password with a hash of the password sent in the request. If the passwords match, the user session is regenerated using the regenerate() method. Notice that req.session.user and req.session.username are set in the regenerated session.

The "getUserProfile" route finds the user by using the user id that is stored in req.session.user. If the user is found, a JSON representation of the user object is returned in the request. If the user is not found, a 404 error is sent.

The "updateUser" route finds the user and then sets the values from the req.body.email and req.body.color properties that will come from the update form in the body of the POST request. Then the save() method is called on the User object, and the request is redirected back to the /user route to display the changed results.

The deleteUser route finds the user in the MongoDB database and then calls the remove() method on the User object to remove the user from the database. Also notice that req.session.destroy() is called to remove the session because the user no longer exists.

#5. Now that the routes are set up and configured, you are ready to implement the views that are rendered by the routes. 
These views are intentionally very basic to allow you to see the interaction between the EJS render engine and the AngularJS support functionality. The following sections discuss the index, signup, login, and user views.

These views are implemented as EJS templates. This chapter uses the EJS render engine because it is very similar to HTML, so you do not need to learn a new template language, such as Jade. However, you can use any template engine that is supported by Express to produce the same results.

Create views/index.html
```
<!doctype html>
<html ng-app="myApp">
<head>
  <title>User Login and Sessions</title>
  <link rel="stylesheet" type="text/css" 
      href="/static/css/styles.css" />
</head>
<body>
  <div ng-controller="myController">
    <h2>Welcome. You are Logged In as <%= username %></h2>
    <a href="/logout">logout</a>
    <a href="/user">Edit User</a>
    <p>Place Your Code Here<p>
  </div>
  <hr><%= msg %>
  <hr>Color <%= color %>
  <script src="http://code.angularjs.org/1.2.9/angular.min.js"></script>
  <script src="/static/js/my_app.js"></script>
</body>
</html>
```
Then create views/login.html
```
<!doctype html>
<html>
<head>
  <title>User Login and Sessions</title>
  <link rel="stylesheet" type="text/css" 
        href="/static/css/styles.css" />
</head>
<body>
  <div class="form-container">
    <p class="form-header">Login</p>
    <form method="POST" action="/login">
        <label>Username:</label>
        <input type="text" name="username"><br>
        <label>Password:</label>
        <input type="password" name="password"><br>
        <input type="submit" value="Login">
    </form>
  </div>
  <a href="/signup">Sign Up</a>
  <hr><%= msg %>
</body>
</html>
```
Then create views/signup.html
```
<!doctype html>
<html>
<head>
  <title>User Login and Sessions</title>
  <link rel="stylesheet" type="text/css" 
      href="/static/css/styles.css" />
</head>
<body>
  <div class="form-container">
    <p class="form-header">Sign Up</p>
    <form method="POST" action="/signup">
      <label>Username:</label>
        <input type="text" name="username"><br>
      <label>Password:</label>
        <input type="password" name="password"><br>
      <label>Email:</label>
        <input type="email" name="email"><br>
      <input type="submit" value="Register">
    </form>       
  </div>
  <hr><%= msg %>
</body>
</html>
```
Then create views/user.html
```
<!doctype html>
<html ng-app="myApp">
<head>
  <title>User Login and Sessions</title>
  <link rel="stylesheet" type="text/css" 
      href="/static/css/styles.css" />
</head>
<body>
  <div class="form-container" ng-controller="myController">
    <p class="form-header">User Profile</p>
    <form method="POST" action="/user/update">
       <label>Username:</label>
         <input type="text" name="username" 
                ng-model="user.username" disabled><br>
       <label>Email:</label>
         <input type="email" name="email" 
                ng-model="user.email"><br>
       <label>Favorite Color:</label>
         <input type="text" name="color" 
                ng-model="user.color"><br>
       <input type="submit" value="Save">
    </form>       
  </div>
  <form method="POST" action="/user/delete">
    <input type="submit" value="Delete User">
  </form>
  <hr><%= msg %>
  <script src="http://code.angularjs.org/1.2.9/angular.min.js"></script>
  <script src="/static/js/my_app.js"></script>
  <a href="/">Home</a>
</body>
</html>
```
You will also need static/css/styles.css
```
div.form-container{
  display: inline-block;
  border: 4px ridge blue;
  width: 280px;
  border-radius:10px;
  margin:10px;
}
p.form-header{
  margin:0px;
  font: 24px bold;
  color:white;  background:blue;
  text-align:center;
}
form{
  margin:10px;
}
label{ width:80px; display: inline-block;}
input{
  border: 3px ridge blue;
  border-radius:5px;
  padding:3px;
}
input[type=submit]{
  font: 18px bold;
  width: 120px;
  color:white;  background:blue;
  margin-top:15px;
  margin-left:85px;
}
```
And you will need the angular controller "static/js/my_app.js"
```js
angular.module('myApp', []).
  controller('myController', ['$scope', '$http', 
                              function($scope, $http) {
    $http.get('/user/profile')
        .success(function(data, status, headers, config) {
      $scope.user = data;
      $scope.error = "";
    }).
    error(function(data, status, headers, config) {
      $scope.user = {};
      $scope.error = data;
    });
  }]);
```

Test your application to make sure you can create a new user, change the colors and see them preserved during the session, then logout to destroy the session.  You can run it by typing:
<pre>
node auth_server.js
</pre>
You will find that you need to install several packages:
<pre>
npm install 
npm install express-session
npm install connect-mongo
npm install ejs
</pre>
Passoff:

You should test your server to make sure it works correctly. You should have utilized google classroom to get started. Your submission to learningsuite should contain:


	- The URL of the working application on your EC2 node (or other host). 



<strong>Behavior</strong> |	<strong>Points</strong>
--- | ---
You can create a new user who is auto-logged-in | 25
When you logout, you can login using that created user. | 15
User color changes persist through authentication cycles. | 15
When you logout the session is destroyed and non-authenticated users cannot access the site. | 20
Your code is included in your submission, your application works with the test driver, and your page looks really good. This is subjective, so wow us. | 25
# finalCreative
