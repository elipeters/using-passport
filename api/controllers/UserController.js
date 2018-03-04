/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var bcrypt = require('bcrypt-nodejs');

module.exports = {


  login: function (req, res) {           
      req.login(req.params.all(), function(err){
        if(err) return res.redirect('back');
        return res.redirect('/');
      });   
  },


  logout: function (req, res) {
    req.logout();
    return res.redirect('/');
  },
  

  signup: function (req, res) {
    return res.view('user/signup',{msg: {info: "All fields are required"}});
  },
  
  create: function (req, res) {
    var params = req.params.all();
    
    //check if account exists - need email for password recovery
    User.findOne({email: params.email}).exec(function(err,user){
      if(user){
        return res.view('user/signup',{msg: {error: "That email is already in use"}});
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
  
  
  account: function(req,res){ //TODO:
    res.view('user/account',{user: req.user});
  },
  
  
  edit: function(req,res){ 
    res.view('user/edit',{user: req.user, msg: {}});
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
        res.view('user/edit', {user: user[0],msg:{success:'Your details have been updated'}});
      });      
      
    });                                        
  },
  
  forgot: function(req,res){ //TODO: go to recovery view and add some recovery options
    res.view('user/recovery');
  }, 
  
  recovery: function(req,res){ //TODO: POST get email - find user from email in db, setup a temporary password and send email for recovery.
    
    User.findOne({email: req.params.email}).exec(function(err,user){
      if(err)return res.serverError(err);

      //TODO: send recovery email
      
      res.view('user/recovery',{msg: msg});
    });
  },
};
