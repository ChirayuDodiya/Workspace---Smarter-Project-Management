import { Response } from 'express';

const successResponse = (res: Response, data: any = null, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res: Response, message = 'Error', status = 500) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

const paginatedResponse = (res: Response, data: any, pagination: any) => {
  return res.json({
    success: true,
    data,
    pagination,
  });
};

export { successResponse, errorResponse, paginatedResponse };
