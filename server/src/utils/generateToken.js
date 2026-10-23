const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token containing user id
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'dev_secret_key_change_in_production_jwt_token';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, {
    expiresIn,
  });
};

module.exports = generateToken;
