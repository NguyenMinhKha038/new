import sharp from 'sharp';
import { logger, BaseError } from '../utils';
import { unlinkSync } from 'fs';
sharp.cache(false);
import Promise from 'bluebird';

const resizeFile = (file, { width = 200, height = null, fit = 'cover' }) => {
  const temp = file.path,
    tempDest = file.destination;
  file.filename = file.filename.replace(/\.[^\/.]+$/, '_resized.jpg');
  file.destination = file.destination.match(/(public|private).+$/)[0];
  file.path = file.destination + file.filename;
  return sharp(temp)
    .resize({ width, height, fit })
    .toFormat('jpg')
    .toFile(tempDest + file.filename)
    .then((res) => {
      unlinkSync(temp);
    })
    .catch((err) => logger.error(err));
};

const resize = (options = { width: 200, height: undefined, fit: 'cover' }) => async (
  req,
  res,
  next
) => {
  try {
    if (req.file) await resizeFile(req.file, options);
    if (req.files) {
      if (req.files instanceof Array)
        await Promise.mapSeries(req.files, async (file) => {
          await resizeFile(file, options);
        });
      else {
        for (const key in req.files) {
          await Promise.mapSeries(req.files[key], async (file) => {
            return await resizeFile(file, options);
          });
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

async function resizeCustom(req, res, next) {
  for (var field in req.files) {
    for (let i = 0; i < field.length; i++) {
      sharp(field[0].path)
        .resize({ width: 300 })
        .toBuffer(function (err, result) {
          if (err) {
            logger.error(err);
            return next(
              new BaseError({
                statusCode: 500,
                error: 'can not resize image',
                errors: err
              })
            );
          }
          return res.send(result);
        });
    }
  }

  return res.send('abc');
}

export default {
  resize,
  resizeCustom
};
