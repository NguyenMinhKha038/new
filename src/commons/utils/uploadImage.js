import BaseResponse from './base-response';
import BaseError from './base-error';
import errorCode from './error-code';

async function uploadImage(req, res, next) {
  try {
    // console.log('REQUEST ON UPLOAD IMAGES', req);
    const images = req.files && req.files.map((file) => file.path);
    if (!images.length) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            images: errorCode['client.wrongImage']
          }
        }).addMeta({ message: 'cannot upload image, wrong image' })
      );
    }
    return new BaseResponse({ statusCode: 200, data: images }).return(res);
  } catch (error) {
    next(error);
  }
}

export default {
  uploadImage
};
