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
};
