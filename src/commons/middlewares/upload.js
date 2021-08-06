import multer from 'multer';
import fs, { mkdir } from 'fs';
import mkdirp from 'mkdirp';
import BaseError from '../utils/base-error';
import errorCode from '../utils/error-code';
import { extname, join } from 'path';
import sharp from 'sharp';
import { logger } from '../utils';
sharp.cache(false);

const getDir = (dir) => join(__dirname, '../../..', dir);

const dirReward = getDir(`public/uploads/v_/rewards/`);
const dirCategory = getDir(`public/uploads/s_/categories/`);
const dirPrivate = getDir(`private/images/`);
const dirCompany = getDir(`public/uploads/s_/companies/`);
const dirProduct = getDir(`public/uploads/s_/products/`);
const dirBusinessForm = getDir(`public/uploads/s_/business-form/`);
const dirBanner = getDir(`public/uploads/s_/banners/`);
const dirImage = getDir(`public/uploads/s_/`);

const storagePrivate = multer.diskStorage({
  destination: function (req, file, cb) {
    !fs.existsSync(dirPrivate)
      ? mkdirp(dirPrivate, (err) => {
          err ? logger('upload err') : cb(null, dirPrivate);
        })
      : cb(null, dirPrivate);
    // console.log(process.env.cwd(), __dirname);
  },
  filename: function (req, file, cb) {
    // sharp()

    const filename = `${new Date().getTime()}.${req.user.id}.${file.fieldname}`;
    cb(null, filename);
  }
});

const storage = (dir) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      !fs.existsSync(dir)
        ? mkdirp(dir, (err) => {
            err ? logger('upload err') : cb(null, dir);
          })
        : cb(null, dir);
    },
    filename: function (req, file, cb) {
      const filename = `${new Date().getTime()}.${req.admin ? req.admin.id : req.user.id}${extname(
        file.originalname
      )}`;
      cb(null, filename);
    }
  });
var fileFilter = function (req, file, cb) {
  var allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { image: errorCode['client.invalidFileType'] }
      })
    );
  }
};
var upload = (storage) =>
  multer({
    limits: { fileSize: 1024 * 1024 * 10 },
    storage,
    fileFilter
  });

const uploadRewardImageMiddleware = upload(storage(dirReward)).single('image');
const uploadCategoryMiddleware = upload(storage(dirCategory)).single('image');

const uploadPicturePrivateMiddleware = upload(storagePrivate).fields([
  { name: 'passport_image', maxCount: 2 },
  { name: 'selfy_image', maxCount: 1 }
]);

const uploadCompanyImageMiddleware = upload(storage(dirCompany)).array('images', 5);
const uploadBusinessFormImageMiddleware = upload(storage(dirBusinessForm)).array('images', 2);

const uploadProductImageMiddleWare = upload(storage(dirProduct)).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 6 }
]);
const uploadBannerImageMiddleWare = upload(storage(dirBanner)).single('image');

const uploadImage = (req, res, next) => {
  const dir = req.query.type;
  return upload(storage(dirImage + dir + '/')).array('images')(req, res, next);
};
const uploadPrivateImageMiddleWare = upload(storagePrivate).array('images');
export default {
  uploadCategoryMiddleware,
  uploadRewardImageMiddleware,
  uploadPicturePrivateMiddleware,
  uploadCompanyImageMiddleware,
  uploadProductImageMiddleWare,
  uploadBusinessFormImageMiddleware,
  uploadBannerImageMiddleWare,
  uploadImage,
  uploadPrivateImageMiddleWare
};
