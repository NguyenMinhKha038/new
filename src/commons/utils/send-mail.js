import fs from 'fs';
import { join } from 'path';
import NodeMailer from 'nodemailer';
import { BaseError, logger } from '.';

async function sendmail(receive_mail, subject, token) {
  let transporter = NodeMailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secure: 'true',
    port: '465',
    auth: {
      type: 'OAuth2', //Authentication type
      user: process.env.GMAIL_SENDER, //For example, xyz@process.env.gmail.com
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRECT,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN
    }
  });
  fs.readFile(join(__dirname, '../../../assets', 'verify-tem.html'), (error, data) => {
    if (error) {
      return next(
        new BaseError({ statusCode: 400, error: '', errors: error }).addMeta({
          message: 'sendmail error'
        })
      );
    } else {
      data = data.toString();
      let action_url = process.env.MAIL_VERIFY_URL + `?token=${token}&email=${receive_mail}`;
      data = data.replace(/{{action_url}}/g, action_url);
      data = data.replace(/{{app_name}}/g, process.env.APP_NAME);

      let mailOptions = {
        from: process.env.GMAIL_SENDER,
        to: receive_mail,
        subject: subject,
        html: data
      };

      transporter.sendMail(mailOptions, function (e, r) {
        if (e) {
          logger.error(e);
          transporter.close();
          return 0;
        } else {
          transporter.close();
          return 1;
        }
      });
    }
  });
}

export default {
  sendmail
};
