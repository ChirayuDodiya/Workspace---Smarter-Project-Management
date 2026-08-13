import jwt from 'jsonwebtoken';

//creates access token
const generateAccessToken = (user: any) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: '15m',
  });
};

//creates refresh token (7 days)
const generateRefreshToken = (user: any) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: '7d',
  });
};

export { generateAccessToken, generateRefreshToken };
