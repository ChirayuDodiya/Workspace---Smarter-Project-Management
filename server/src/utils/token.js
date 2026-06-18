import jwt from 'jsonwebtoken';

//creates access token
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
};

//creates refresh token (7 days)
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

export { generateAccessToken, generateRefreshToken };
