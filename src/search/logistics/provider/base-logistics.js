import Ghn from './ghn';
import Ghtk from './ghtk';

export default {
  ghn: new Ghn(process.env.GHN_URL, process.env.GHN_API_KEY, process.env.GHN_CLIENT_ID),
  ghtk: new Ghtk()
};
