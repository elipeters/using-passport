module.exports.routes = {

  '/': { view: 'homepage' },
  
   //User
  'get /login': {view: 'user/login'},
  'get /signup': {view: 'user/signup'},
  
  'post /login': 'UserController.login',
  'post /signup': 'UserController.signup',
  
  'post /update': 'UserController.update',
  '/logout': 'UserController.logout',
  '/welcome': {view: 'user/account'},
  'get /edit': 'UserController.edit',
  'get /account': 'UserController.account', 
  'get /forgot': {view: 'user/recovery'},
  'post /recovery': 'UserController.recovery', 
};
