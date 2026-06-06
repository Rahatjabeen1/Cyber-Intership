const md5 = require('md5');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Users, Org, Wallet } = require('../models/db');
const jwt = require('jsonwebtoken');
const emailvalidator = require('email-validator');
const logger = require('../logger'); // WEEK 3: Security Logger import kiya

function generateAccessToken(username) {
  const payload = { 'username': username };
  return jwt.sign(payload, process.env.JWT_SECRET);
}

function authenticateToken(req, res, next) {
  const jwt_token = req.cookies.authToken;
  if (jwt_token == null) {
    return res.redirect('/login');
  };

  jwt.verify(jwt_token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn(`Security Alert: Unauthorized or expired JWT verification attempt.`); // WEEK 3 LOG
      return res.sendStatus(403);
    }
    Users.findOne({ attributes: ['id', 'username', 'email', 'orgname', 'apiToken', 'totpSecret', 'profilePic'], where: { username: user.username } })
        .then((queryResult) => {
          if (queryResult == null) {
            res.clearCookie('authToken', '');
            res.redirect('/login');
          } else {
            req.user = queryResult;
            next();
          }
        });
  });
}

const register_get = (req, res) => {
  res.render('register.ejs');
};

function gift_crypto(max, min) {
  return (Math.random() * (max - min) + min).toFixed(8);
}

const register_post = async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  if (!emailvalidator.validate(email)) {
    logger.warn(`Validation Error: Invalid email format submitted: ${email}`); // WEEK 3 LOG
    return res.status(400).send('Invalid email');
  }

  try {
    const count = await Users.findAll({ where: { username: username } });

    if (count.length != 0) {
      logger.warn(`Registration Conflict: Username already exists: ${username}`); // WEEK 3 LOG
      return res.status(403).send('User already registerd!');
    } 
    
    if (username !== '' && password !== '' && email !== '') {
      const apiToken = crypto.randomBytes(20).toString('hex');
      
      // WEEK 2 FIX: 
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await Users.create({
        username: username, 
        email: email, 
        password: hashedPassword, // Secured!
        orgname: '', 
        apiToken: apiToken, 
        totpSecret: ''
      });

      await Org.create({ orgname: '', owner: username });
      await Wallet.create({ username: username, BTC: gift_crypto(0.0025, 0.001), ETH: gift_crypto(0.5, 0.1) });
      
      logger.info(`Success Log: New user registered successfully: ${username}`); // WEEK 3 LOG

      const jwt_token = generateAccessToken(username, email);
      res.cookie('authToken', jwt_token);
      res.send(jwt_token);
    } else {
      res.status(400).send('username/password/email can not be null');
    }
  } catch (error) {
    logger.error(`System Error during registration: ${error.message}`); // WEEK 3 LOG
    res.status(500).send('Internal Server Error');
  }
};

const logout_get = (req, res) => {
  res.clearCookie('authToken', '');
  res.redirect('/login');
};

const login_get = (req, res) => {
  res.render('login');
};

// WEEK 2 & 3 UPGRADE: Login authentication logic handles bcrypt safely
// const login_post = async (req, res) => {
//   const username = req.body.username;
//   const password = req.body.password;

//   if (username !== '' && password !== '') {
//     try {
//       // Pehle user ko sirf username se dhoondein
//       const user = await Users.findOne({ where: { username: username } });

//       if (user) {
//         // WEEK 2 FIX: Bcrypt algorithm se incoming plaintext password ko database wale hash se compare karein
//         const isMatch = await bcrypt.compare(password, user.password);

//         if (isMatch) {
//           logger.info(`Authentication Success: User logged in: ${username}`); // WEEK 3 LOG
//           const jwt_token = generateAccessToken(username, user.email);
          
//           res.cookie('authToken', jwt_token);
//           // if (user.totpSecret != '') {
//           //   return res.status(200).send('/totp-verification');
//           // } else {
//           //   return res.status(200).send('/');
//           // }
//           return res.status(200).send('/');
//         }
//       }
      
//       // Agar user nahi mila ya password galat hua
//       logger.warn(`Authentication Failure: Failed login attempt for user: ${username}`); // WEEK 3 LOG
//       return res.status(403).send('Invalid username/password.');

//     } catch (error) {
//       logger.error(`System Error during login pipeline: ${error.message}`); // WEEK 3 LOG
//       return res.status(500).send('Internal Server Error');
//     }
//   } else {
//     return res.status(400).send('Fields cannot be empty');
//   }
// };
const login_post = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username !== '' && password !== '') {
    try {
      console.log("=== LOGIN DEBUGGING START ===");
      console.log("Incoming plain text password:", password);

      // User ko database se dhoondein
      const user = await Users.findOne({ where: { username: username } });

      if (!user) {
        console.log("❌ ERROR: Database mein is username ka koi user nahi mila:", username);
        return res.status(403).send('Invalid username/password.');
      }

      console.log("User mila database mein:", user.username);
      console.log("Database mein saved hash password:", user.password);
      console.log("Hash password ki actual length:", user.password.length);

      // Bcrypt comparison
      const isMatch = await bcrypt.compare(password, user.password);
      console.log("Bcrypt comparison result (isMatch):", isMatch);

      if (isMatch) {
        logger.info(`Authentication Success: User logged in: ${username}`);
        const jwt_token = generateAccessToken(username, user.email);
        
        res.cookie('authToken', jwt_token);
        
        // Check totpSecret
        console.log("User totpSecret value:", user.totpSecret);
        if (user.totpSecret && user.totpSecret !== '') {
          console.log("Redirecting to totp-verification");
          return res.status(200).send('/totp-verification');
        } else {
          console.log("Redirecting to home '/'");
          return res.status(200).send('/');
        }
      } else {
        console.log("❌ ERROR: Password Match nahi hua (Bcrypt.compare failed)");
      }
      
      logger.warn(`Authentication Failure: Failed login attempt for user: ${username}`);
      return res.status(403).send('Invalid username/password.');

    } catch (error) {
      console.log("❌ CATCH ERROR:", error);
      logger.error(`System Error during login pipeline: ${error.message}`);
      return res.status(500).send('Internal Server Error');
    }
  } else {
    return res.status(400).send('Fields cannot be empty');
  }
};
module.exports = {
  register_get,
  register_post,
  authenticateToken,
  logout_get,
  login_get,
  login_post,
};