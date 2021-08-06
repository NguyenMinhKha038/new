import sharp from 'sharp';
import { BaseResponse, logger } from '../utils';
import { unlink } from 'fs';
sharp.cache(false);
import Promise from 'bluebird';
import Joi from '@hapi/joi';

const resizeFileMultiSize = (file, sizes, needResized) => {
  const temp = file.path,
    tempDest = file.destination;
  file.filename = file.filename.replace(/\.[^\/.]+$/, '') + '-r';
  file.destination = file.destination.match(/(public|private).+$/)[0];
  file.path = file.destination + file.filename;
  if (!needResized)
    return sharp(temp)
      .resize({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFormat('jpg')
      .toFile(tempDest + file.filename + '.jpg');
  return Promise.each(sizes, (size) =>
    sharp(temp)
      .resize({
        width: size.width,
        height: size.height,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFormat('jpg')
      .toFile(tempDest + file.filename + '-' + size.width + '.jpg')
  ).finally((res) => {
    // unlink(temp, (err) => {
    //   if (err) logger.error(err);
    // });
  });
};
const SIZES = [
  { width: 1200, height: 600 },
  { width: 900, height: 450 },
  { width: 600, height: 300 },
  { width: 320, height: 160 }
];

const SIZE = [{ width: 200, height: 200 }];

const resizeImage = async (req, res, next) => {
  try {
    const { type } = req.query;
    let sizes,
      needResized = true;
    switch (type) {
      case 'company_logo':
        sizes = SIZE;
        break;
      case 'company_cover':
        sizes = SIZES;
        break;
      case 'company_images':
        sizes = SIZES;
        break;
      case 'product_thumbnail':
        sizes = SIZE;
        break;
      case 'product_images':
        sizes = SIZES;
        break;
      case 'banner':
        sizes = SIZES;
        break;
      case 'business_registration_form':
        sizes = [{ width: 1200, height: 1600 }];
        break;
      case 'company_deposit':
        sizes = [{ width: 400, height: 800 }];
        break;
      case 'promotion_banner':
        sizes = SIZES;
        break;
      case 'category':
      case 'admin_bank':
        needResized = false;
        // sizes = [{ width: 129, height: 129 }];
        break;
      case 'report':
        needResized = false;
        break;
      case 'store_logo':
        sizes = SIZE;
        break;
      case 'store_cover':
        sizes = SIZES;
        break;
      default:
        break;
    }
    if (req.files) {
      await Promise.mapSeries(req.files, async (file) =>
        resizeFileMultiSize(file, sizes, needResized)
      );
    }
    const images = req.files && req.files.map((file) => file.path);
    return new BaseResponse({ statusCode: 200, data: images }).addMeta({ sizes }).return(res);
  } catch (error) {
    next(error);
  }
};

const imageValidation = {
  query: {
    type: Joi.string().valid([
      'admin_bank',
      'company_logo',
      'company_cover',
      'company_images',
      'product_thumbnail',
      'product_images',
      'banner',
      'business_registration_form',
      'company_deposit',
      'promotion_banner',
      'category',
      'global-promotion',
      'report',
      'store_logo',
      'store_cover'
    ])
  }
};

export default {
  resizeImage,
  imageValidation
};
