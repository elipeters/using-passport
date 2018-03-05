# using-passport

> a [training vessel](https://github.com/sails101) with [Sails](http://sailsjs.org)


For many Sails apps, Passport is overkill- it's quite easy to set up local authentication yourself using only `req.session`.

But in scenarios where you're doing authentication across multiple providers, Passport can make sense, and save you a lot of time.

This tutorial takes advantage of a quick passport hook I put together to eliminate some of the more confusing aspects of integration with Sails from user-space.  For an in-depth tutorial on how the hook ended up getting built, check out [ORIGINAL_PREHOOK_WALKTHROUGH.md](https://github.com/sails101/using-passport/blob/master/ORIGINAL_PREHOOK_WALKTHROUGH.md).


## Step 1: Install the passport hook

Install older version of Passport, Passport-Local and Bcrypt-nodejs.
```shell
$ npm install passport@0.2.2 passport-local@1.0.0 bcrypt-nodejs@0.0.3
```
## Step 2: Create `User.js` and `UserController.js`

We'll add a stub `login()`, `logout()`, and `signup()` action while we're at it.

```shell
$ sails generate api user login logout signup
```


Now let's build each of the API actions.

## Step 3: Login

If the user login is successful, we'll redirect to `/`.

```js
/**
 * `UserController.login()`
 */
  login: function (req, res) {           
      req.login(req.params.all(), function(err){
        if(err) return res.view({msg: {type: "danger", body: "Incorrect username or password"}}, 'user/login');
        return res.redirect('user/account');
      });   
  },
```

## Step 5: Logout

```js
/**
 * `UserController.logout()`
 */
logout: function (req, res) {
  req.logout();
  return res.redirect('/');
},
```

## Step 6: Signup & Create

```js
/**
 * `UserController.signup()`
 */
  signup: function (req, res) {
    return res.view('user/signup',{msg: {type: "info", body: "All fields are required"}});
  },

  create: function (req, res) {
    var params = req.params.all();
    
    //check if account exists - need email for password recovery
    User.findOne({email: params.email}).exec(function(err,user){
      if(user){
        return res.view('user/signup',{user: params, msg: {type: "danger", body: "That email is already in use"}});
      }else{
        //create user with hash password, we use the given password to login
        User.create({
          firstname: params.firstname,
          lastname: params.lastname,
          username: params.username,
          email: params.email,
          password: req.hash(params.password)    
        }).exec(function (err, user) {
          if(err)return res.negotiate(err);

          //login user with supplied password - nested as User.create is asynchronous
          req.login(params, function (err){
            if(err)return res.negotiate(err);
            req.isAuthenticated();
            return res.view('user/account',{user: user});
          });
        });
      }
    });
    
  },
```

## Step 7: Account, Edit and Update

```js
  account: function(req,res){ //TODO:
    res.view('user/account',{user: req.user});
  },
  
  edit: function(req,res){ 
    res.view('user/edit',{user: req.user, msg: {type: "info", body: "All fields are required"}});
  },
  
  update: function(req,res){ //TODO: hash password
    var params = req.params.all();    
    
    //TODO: hash password in model
    User.findOne({id: req.user.id}).exec(function(err,user){
      if(err)return res.serverError(err);
      
      var current = params.password,
          hash = user.password,
          update = params.newpassword;
      
            //check for new password
      if(update){        
        //if the new and old passwords are the same update params with update hash
        if(req.comparePassword(password,hash)){
          
          params.password = req.hash(update);

          //remove newpassword from params before sending
          delete params.newpassword;  
        }
      }

      //update the new user and return back to the edit page
      User.update({id:user.id},params).exec(function(err, user){
        if(err) return res.serverError(err);
        
        //update req        
        req.user = user[0];
        
        //send successful user update
        res.view('user/edit', {user: user[0],msg:{type: "success", body:'Your details have been updated'}});
      });      
      
    });                                        
  },
```

#### Now what?

So we're about ready to start trying this stuff out.

We could test our API right now using cURL or POSTman, but it'd be more useful long-term to put something in our app.  So how should we do it?  Build a quick front-end?  What kind? A mobile app?  A website?  AJAX or Socket.io or tradtional web forms?  Fortunately, our login backend [doesn't care](https://www.youtube.com/watch?v=4r7wHMg5Yjg).

For familiarity/simplicity, we'll just do some simple web forms.


## Step 8: Create some views

Let's create an empty directory at `views/user/`, then create two files: `user/login.ejs` and `user/signup.ejs`. These will be our forms.

## Step 9: Custom URLs

Next, let's set up some friendly URLs as custom routes in our `config/routes.js` file:

```
module.exports.routes = {
  '/': { view: 'homepage' },
  
  //User
  'get /login': {view: 'user/login'},
  'get /signup': 'UserController.signup',
  'get /edit': 'UserController.edit',
  'get /logout': 'UserController.logout',
  'get /welcome': {view: 'user/account'},
  'get /account': 'UserController.account', 
  'get /forgot': {view: 'user/recovery'},
  
  'post /login': 'UserController.login',
  'post /signup': 'UserController.create',
  
  'post /update': 'UserController.update',
  'post /recovery': 'UserController.recovery', 
```

And now since we've mapped everything out, we can disable blueprint routing so that the only URLs exposed in our application are those in our `routes.js` file and the routes created by static middleware serving stuff in our `assets/` directory.

~~_(Note that is optional- I'm doing it here to be explicit and make it clear that there's no magic going on)_~~

~~To disable blueprint routing, change your `config/blueprints.js` file to look like this:~~

~~```js
module.exports.blueprints = {
  actions: false,
  rest: false,
  shortcuts: false
};
```~~

## Step 9: Make the views talk to the backend

Now that we have a backend with nice-looking routes, and we have our views hooked up to them, let's set up those HTML forms to communicate with the backend.  As you probably know, this could just as easily be done w/ AJAX or WebSockets/Socket.io (using sails.io.js.)

These forms use two partials to display messages and form content.

#### Login Form

`user/login.ejs` should POST a username and password to `/login`.

```html
<h1>Login</h1>

<%- partial('./partials/msg.ejs') %>

<form action="/login" method="post">

  <label for="username">Username</label>
  <input name="username" type="text"/>
  <br/>

  <label for="password">Password</label>
  <input name="password" type="password"/>
  <br/>

  <input type="submit"/>
</form>
```



#### Signup Form

`user/signup.ejs` should POST a username and password to `/signup`.

```html
<h1>Signup</h1>

<%- partial('./partials/msg.ejs') %>

<form action="/signup" method="post">
  
  <%- partial('./partials/form.ejs') %>

  <p>Already have an account? <br>
  <a href="/login">Click here to login.</a></p>

  <input type="submit"/>
</form>
```



#### Edit Form

```html
<h1>Edit Details</h1>

<%- partial('./partials/msg.ejs') %>

<form action="update" method="post">

  <%- partial('./partials/form.ejs') %>

  <a href="/forgot">Forgotten your password?</a>

  <label for="newpassword">New Password</label>
  <input name="newpassword" type="password" minlength="8" value="" class="form-control"/>

  <a class="mb-3 btn btn-danger" href="/">Cancel</a>
  <input class="mb-3 btn btn-primary" type="submit" autofocus value="Update" />

</form>
```


#### Account Page

```html
<h1>Account Details</h1>

<h5>Hi <%= user.firstname %> <%= user.lastname %>!</h5>

<ul class="list-unstyled">
  <li>Username: <%= user.username %></li>
  <li>Email: <%= user.email %></li>    
</ul>

<a href="/">Close</a>
<a href="/logout">Log out</a>
<a href="/edit">Edit</a>
<a href="/">Home</a>
```


## Step 10: Create the passport hook

Create the folder structure api/**hooks**/**passport** and add the file **index.js**. 


## Step 11: Extend local reach.

Update **bootstrap.js** in the **config** folder.

```js
module.exports.bootstrap = function(cb) {
  
  _.extend(sails.hooks.http.app.locals, sails.config.http.locals);
  
  cb();
};
```


## Step 12: Define access.

Define your users access rights to your controllers with **isAuthenticated** for a logged in user. 

```js
  UserController: {
    '*': 'isAuthenticated',
    login: true, // should always be accessible
    signup: true, 
    forgot: true,
    recovery: true,
    create: true
  },
  };
```
