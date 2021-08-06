import requestPromise from 'request-promise';

export default class Ghtk {
  constructor(baseUrl, mainToken) {
    this.baseUrl = baseUrl;
    this.mainToken = mainToken;
    this.api = {
      calculateFee(data = {}) {
        this.call({ uri: '/services/shipment/order/', query: data });
      },
      createOrder(data = {}) {
        this.call({ uri: '/services/shipment/order', body: data });
      },
      getOrderInfo(order_id) {
        this.call({ uri: '/services/shipment/v2/' + order_id });
      },
      cancelOrder(order_id) {
        this.call({ uri: '/services/shipment/cancel/' + order_id });
      },
      getLabelOrder(order_id) {
        this.call({ uri: '/services/label/' + order_id });
      },
      getAddress() {
        this.call({ uri: 'services/shipment/list_pick_add' });
      }
    };
  }
  call({ uri, query = {}, body = {}, token }) {
    return requestPromise(uri, {
      baseUrl: this.baseUrl,
      body,
      qs: query,
      headers: { token, 'X-Refer-Token': this.token }
    });
  }
}
