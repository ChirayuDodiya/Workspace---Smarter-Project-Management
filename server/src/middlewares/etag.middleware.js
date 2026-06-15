import etag from 'etag';

export const etagMiddleware = (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const originalSend = res.send;

  res.send = function (body) {
    if ((res.statusCode === 200 || res.statusCode === 201) && !res.get('ETag') && body) {
      let stringBody = body;

      if (typeof body === 'object' && !Buffer.isBuffer(body)) {
        stringBody = JSON.stringify(body);
      }

      const etagValue = etag(stringBody);
      res.set('ETag', etagValue);

      // console.log("Generated ETag:", etagValue);
      // console.log("If-None-Match:", req.headers["if-none-match"]);

      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch && ifNoneMatch === etagValue) {
        res.status(304);
        return res.end();
      }
    }
    return originalSend.apply(this, arguments);
  };

  next();
};

export default etagMiddleware;
