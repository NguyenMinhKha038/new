import Vimo from './vimo';
import { Tplink } from './tplink';

export default {
  vimo: new Vimo({
    URL_API: process.env.VIMO_URL,
    MC_CODE: process.env.VIMO_CODE,
    MC_AUTH_USER: process.env.VIMO_AUTH_USER,
    MC_AUTH_PASS: process.env.VIMO_AUTH_PASS,
    MC_ENCRYPT_KEY: process.env.VIMO_ENCRYPT_KEY,
    MC_CHECKSUM_KEY: process.env.VIMO_CHECKSUM_KEY
  }),
  tplink: new Tplink({})
};
