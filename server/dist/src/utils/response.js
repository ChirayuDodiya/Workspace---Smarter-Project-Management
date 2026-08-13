const successResponse = (res, data = null, message = 'Success', status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data,
    });
};
const errorResponse = (res, message = 'Error', status = 500) => {
    return res.status(status).json({
        success: false,
        message,
    });
};
const paginatedResponse = (res, data, pagination) => {
    return res.json({
        success: true,
        data,
        pagination,
    });
};
export { successResponse, errorResponse, paginatedResponse };
