import { configService } from '../config';

let enterpriseWebAppVersion;
let adminWebAppVersion;

const initEnterpriseAppVersion = async () => {
  const appVersionConfig = await configService.findByKey('app_version');
  if (appVersionConfig) {
    enterpriseWebAppVersion = appVersionConfig.value.enterprise_web;
  }
};

const initAppVersion = async () => {
  const appVersionConfig = await configService.findByKey('app_version');
  if (appVersionConfig) {
    enterpriseWebAppVersion = appVersionConfig.value.enterprise_web;
    adminWebAppVersion = appVersionConfig.value.admin_web;
  }
};

/**
 *
 * @param {'enterprise' | 'admin'} app_type
 * @param {*} version
 */
export const updateAppVersion = (app_type, version) => {
  if (version && app_type) {
    switch (app_type) {
      case 'enterprise': {
        enterpriseWebAppVersion = version;
        return;
      }
      case 'admin': {
        adminWebAppVersion = version;
        return;
      }
      default:
        return;
    }
  }
};

/**
 *
 * @param {'enterprise_web_app_version' | 'admin_web_app_version'} appType
 * @param {*} version
 * @returns {void}
 */
const setAppVersionToHeader = (appType, version) => (res) => {
  if (appType && version) {
    const currentAccessCustomKey = res.get('Access-Control-Expose-Headers');
    const newAccessCustomKey = currentAccessCustomKey
      ? currentAccessCustomKey + ', ' + appType
      : appType;

    res.set('Access-Control-Expose-Headers', newAccessCustomKey);
    res.set(appType, version);
  }
};

const setAppVersion = (req, res, next) => {
  setAppVersionToHeader('enterprise_web_app_version', enterpriseWebAppVersion)(res);
  setAppVersionToHeader('admin_web_app_version', adminWebAppVersion)(res);
  next();
};

/**
 *
 * @param {'enterprise_web' | 'admin_web'} app_type
 * @returns {string}
 */
export const getAppVersion = (app_type) => {
  switch (app_type) {
    case 'enterprise_web': {
      return enterpriseWebAppVersion;
    }
    case 'admin_web': {
      return adminWebAppVersion;
    }
    default: {
      return '';
    }
  }
};

export default {
  setAppVersionToHeader,
  setAppVersion,
  updateAppVersion,
  initEnterpriseAppVersion,
  initAppVersion
};
