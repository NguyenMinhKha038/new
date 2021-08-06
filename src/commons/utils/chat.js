import { BaseError, logger as Logger, errorCode } from '.';
import axios from 'axios';
import logger from './winston-logger';

let chatAdminId;
let chatAdminToken;
const loginToChatServer = async () => {
  try {
    if (chatAdminId && chatAdminToken) {
      logger.info('Admin already login');
      return true;
    }
    const username = process.env.CHAT_SERVER_ADMIN;
    const password = process.env.CHAT_SERVER_PASSWORD;

    const api = process.env.CHAT_SERVER_URI + '/api/v1/login';

    const response = await axios.post(api, {
      user: username,
      password
    });
    if (response.status >= 200 && response.status < 300) {
      chatAdminId = response.data.data.userId;
      chatAdminToken = response.data.data.authToken;
      logger.info('Login to chat success');
      return true;
    } else {
      return false;
    }
  } catch (error) {
    Logger.error('Login to chat server error %o', error.response);
    return false;
  }
};

const createChatUser = async (name, email, username, password) => {
  try {
    if (!chatAdminId || !chatAdminToken) {
      return false;
    }

    const api = process.env.CHAT_SERVER_URI + '/api/v1/users.create';

    const response = await axios.post(
      api,
      {
        name,
        email,
        password,
        username
      },
      {
        headers: {
          'X-Auth-Token': chatAdminToken,
          'X-User-Id': chatAdminId
        }
      }
    );
    Logger.info('Create chat user successfully %o', { name, email, password, username });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    Logger.error('Create user error %o', error.response);
    return false;
  }
};

const deleteChatUser = async (username) => {
  try {
    if (!chatAdminId || !chatAdminToken) {
      return false;
    }

    const api = process.env.CHAT_SERVER_URI + '/api/v1/users.delete';

    const response = await axios.post(
      api,
      { username },
      {
        headers: {
          'X-Auth-Token': chatAdminToken,
          'X-User-Id': chatAdminId
        }
      }
    );
    return response.success;
  } catch (error) {
    Logger.error('Delete user error %o', error.response);
    return false;
  }
};

export default {
  createChatUser,
  loginToChatServer,
  deleteChatUser
};
