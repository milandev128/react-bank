// By: https://github.com/techiediaries/fake-api-jwt-json-server

const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('./api/db.json');
const middlewares = jsonServer.defaults();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const bodyParser = require('body-parser');

const userdb = JSON.parse(fs.readFileSync('./api/users.json', 'UTF-8'));

const SECRET_KEY = '349b31aea64aaf6d9ab49441e22a60a5';
const expiresIn = '1h';

server.use(middlewares);
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

// Create a token from a payload
function createToken(payload) {
   return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

// Verify the token
function verifyToken(token) {
   return jwt.verify(token, SECRET_KEY, (err, decode) => (decode !== undefined ? decode : err));
}

// Check if the user exists in database
function isAuthenticated({ email, password }) {
   return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1;
}

server.post('/auth/login', (req, res) => {
   const { email, password } = req.body;

   if (isAuthenticated({ email, password }) === false) {
      const status = 401;
      const message = 'Incorrect email or password';
      res.status(status).json({ status, message });
      return;
   }
   const access_token = createToken({ email, password });
   res.status(200).json({ access_token });
});

server.use(/^(?!\/auth).*$/, (req, res, next) => {
   if (
      req.headers.authorization === undefined ||
      req.headers.authorization.split(' ')[0] !== 'Bearer'
   ) {
      const status = 401;
      const message = 'Error in authorization format';
      res.status(status).json({ status, message });
      return;
   }

   try {
      verifyToken(req.headers.authorization.split(' ')[1]);
      next();
   } catch (err) {
      const status = 401;
      const message = 'Error access_token is revoked';
      res.status(status).json({ status, message });
   }
});

server.use(router);

server.listen(3001, () => {
   console.log('Run Auth API Server');
});