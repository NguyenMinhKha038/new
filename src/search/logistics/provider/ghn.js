import axios from 'axios';
import { BaseError, errorCode, logger, mergeObject } from '../../../commons/utils';
export default class Ghn {
  constructor(baseUrl, mainToken, clientId) {
    console.log('ghn', baseUrl);
    this.baseUrl = baseUrl;
    this.mainToken = mainToken;
    this.clientId = clientId;
    this.axiosInstance = axios.create({ baseURL: this.baseUrl });
    this.api = {
      calculateFee: (data, shop_id) =>
        this.call({ uri: '/v2/shipping-order/fee', data, headers: { shop_id } }),
      createOrder: (data, shop_id) =>
        this.call({ uri: '/v2/shipping-order/create', data, headers: { shop_id } }),
      getOrderInfo: (data = { order_code: '' }, shop_id) =>
        this.call({ uri: '/v2/shipping-order/detail', data, headers: { shopid: shop_id } }),
      updateOrder: (data) => this.call({ uri: '/v2/shipping-order/update', data }),
      returnOrder: (data) => this.call({ uri: '/v2/switch-status/return', data }),
      cancelOrder: (data) => this.call({ uri: '/v2/switch-status/cancel', data }),
      getServices: (params = { from_district: 0, to_district: 0 }) =>
        this.call({ uri: '/pack-service/all', params }),
      getProvinces: () => this.call({ uri: '/master-data/province' }),
      getDistricts: (params = { province_id: 0 }) =>
        this.call({ uri: '/master-data/district', params }),
      getWards: (params = { district_id: 0 }) =>
        this.call({ uri: '/master-data/ward', data: params }),
      createStore: (data) => this.call({ uri: '/v2/shop/register', data }),
      getStores: (params = { offset: 0, limit: 0, clientphone: '' }) =>
        this.call({ uri: '/v2/shop/all', params }),
      getStoreInfo: (shop_id) =>
        this.call({ uri: '/v2/shop', headers: { shopid: shop_id }, params: { id: shop_id } }),
      updateStore: (data, shop_id) =>
        this.call({ uri: '/v2/shop/update', data, headers: { shopid: shop_id } }),
      getOrderFee: (data = { order_code: '' }, shop_id) =>
        this.call({ uri: '/v2/shipping-order/soc', data, headers: { shopid: shop_id } })
    };
    this.initData();
    this.status = {
      ready_to_pick: 'Chờ lấy hàng',
      picking: 'Đang đi lấy hàng',
      delivery_fail: 'Giao hàng thất bại',
      cancel: 'Đơn hàng đã bị Hủy',
      return: 'Trả hàng, 3 lần giao hàng không thành công',
      returned: 'Đã được trả lại cho người bán',
      lost: 'Đơn hàng đã bị thất lạc',
      damage: 'Đơn hàng đã bị hư hỏng',
      exception: 'Ngoại lệ',
      picked: 'Đã lấy hàng thành công',
      storing: 'Chuyển hàng hóa về kho',
      transporting: 'Đang được luân chuyển',
      sorting: 'Đang được sắp xếp',
      delivering: 'Đang được giao',
      delivered: 'Đã giao thành công'
    };
  }
  async initData() {
    this.districtList = await this.api.getDistricts();
    logger.info('districtList loaded');
    this.wardList = await this.api.getWards({ district_id: -1 });
    logger.info('wardList loaded');
  }
  async call({ uri, data = {}, params = {}, headers = {} }) {
    try {
      const token = data.token || this.mainToken;
      logger.info('url %s %o %o %o', uri, data, params, headers);
      const res = await this.axiosInstance.post(uri, data, {
        params,
        headers: mergeObject({}, { token, ...headers })
      });
      // logger.info('data %o', res.data.data);
      return res.data.data;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
  /**
   *
   *
   * @returns {(keyof this.status)[]}
   * @memberof Ghn
   */
  statusList() {
    return Object.keys(this.status);
  }
  async validateToken(data = {}) {
    const response = await this.api.getHubs(data);
    return response.code !== 0;
  }
  getStatus(status) {
    return this.status[status];
  }
  /**
   *
   *
   * @param {store: {}} store
   * @memberof Ghn
   */
  async createStore(store) {
    try {
      const selectedDistrict = this.districtList.find(
        (_district) => _district.DistrictName === store.address.district
      );
      const selectedWard = this.wardList.find(
        (_ward) =>
          _ward.WardName === store.address.ward.trim().replace('0', '') &&
          _ward.DistrictID === selectedDistrict.DistrictID
      );
      const data = await this.api.createStore({
        district_id: selectedDistrict.DistrictID,
        ward_code: selectedWard.WardCode,
        name: store.name,
        phone: store.address.phone_number,
        address: store.normalizedAddress
      });
      store.ghn_shop_id = data.shop_id;
      await store.save();
    } catch (error) {
      logger.error(error);
      throw new BaseError({
        statusCode: 500,
        error: errorCode.client,
        errors: { logistics: errorCode['client.logisticsIsUnavailable'] }
      });
    }
  }
  /**
   *
   *
   * @param {store: {}} store
   * @memberof Ghn
   */
  async updateStore(store) {
    try {
      const selectedStore = await this.api.getStoreInfo(store.ghn_shop_id);
      const selectedDistrict = this.districtList.find(
        (_district) => _district.DistrictName === store.address.district
      );
      const selectedWard = this.wardList.find(
        (_ward) =>
          _ward.WardName === store.address.ward.trim().replace('0', '') &&
          _ward.DistrictID === selectedDistrict.DistrictID
      );
      const data = await this.api.updateStore(
        {
          ...selectedStore,
          district_id: selectedDistrict.DistrictID,
          ward_code: selectedWard.WardCode,
          name: store.name,
          phone: store.address.phone_number,
          address: store.normalizedAddress
        },
        store.ghn_shop_id
      );
      console.log('data', data);
    } catch (error) {
      logger.error(error);
      throw new BaseError({
        statusCode: 500,
        error: errorCode.client,
        errors: { logistics: errorCode['client.logisticsIsUnavailable'] }
      });
    }
  }
  async getFee({ order, fromAddress, toAddress }) {
    try {
      order.getPriceV3();
      logger.info('order %o', order);
      const hasProductWithoutHeight = order.products.some(
        (product) => !product.detail.packaging_height
      );
      const attribute = order.products.reduce(
        (prev, curt) => ({
          weight: prev.weight + curt.detail.packaging_weight * curt.quantity,
          ...(!hasProductWithoutHeight
            ? {
                height: prev.height + curt.detail.packaging_height * curt.quantity,
                length: prev.length + curt.detail.packaging_length,
                width: prev.width + curt.detail.packaging_width
              }
            : {})
        }),
        { weight: 0, width: 0, height: 0, length: 0 }
      );
      console.log({ fromAddress, toAddress, attribute });
      const FromDistrict = this.districtList.find(
        (district) => district.DistrictName === fromAddress.district.trim()
      );
      const ToDistrict = this.districtList.find(
        (district) => district.DistrictName === toAddress.district.trim()
      );
      if (!FromDistrict || !ToDistrict)
        throw new BaseError({
          statusCode: 403,
          error: errorCode.client,
          errors: { address: errorCode['client.AddressIsNotValid'] }
        });
      /*  logger.info('fromWardsResponse %o', fromWardsResponse);
      logger.info('toWardsResponse %o', toWardsResponse); */
      const FromWard = this.wardList.find(
        (ward) =>
          ward.WardName === fromAddress.ward.trim().replace('0', '') &&
          ward.DistrictID === FromDistrict.DistrictID
      );
      const ToWard = this.wardList.find(
        (ward) =>
          ward.WardName === toAddress.ward.trim().replace('0', '') &&
          ward.DistrictID === ToDistrict.DistrictID
      );
      if (!FromWard || !ToWard)
        throw new BaseError({
          statusCode: 403,
          error: errorCode.client,
          errors: { address: errorCode['client.AddressIsNotValid'] }
        });

      // const services = await this.api.getServices({
      //   from_district: FromDistrict.DistrictID,
      //   to_district: ToDistrict.DistrictID
      // });
      // console.log('service', services);
      // const selectedService = services.sort((a, b) => a.service_id - b.service_id);
      // console.log('selectedService', selectedService);
      Object.assign(order.logistics_info, {
        from_district_id: FromDistrict.DistrictID,
        to_district_id: ToDistrict.DistrictID,
        weight: attribute.weight,
        length: attribute.length,
        width: attribute.width,
        height: attribute.height,
        insurance_value: order.original_total < 3e6 ? order.original_total : 3e6,
        to_ward_code: ToWard.WardCode,
        from_ward_code: FromWard.WardCode,
        service_type_id: 2
        // service_id: selectedService[0].service_id
      });
      const fee = await this.api.calculateFee(
        {
          ...order.logistics_info
        },
        order.logistics_info.shop_id
      );
      // console.log('fee', fee);
      return fee.total;
    } catch (error) {
      logger.error(error);
      if (error instanceof BaseError) throw error;
      throw new BaseError({
        statusCode: 500,
        error: errorCode.client,
        errors: { logistics: errorCode['client.logisticsIsUnavailable'] }
      });
    }
  }
  async getTempFee({ product, store, toAddress }) {
    try {
      // const FromDistrict = this.districtList.find(
      //   (district) => district.DistrictName === store.address.district.trim()
      // );
      const ToDistrict = this.districtList.find(
        (district) => district.DistrictName === toAddress.district.trim()
      );
      if (!ToDistrict)
        throw new BaseError({
          statusCode: 403,
          error: errorCode.client,
          errors: { address: errorCode['client.AddressIsNotValid'] }
        });
      const ToWard = this.wardList.find(
        (ward) =>
          ward.WardName === toAddress.ward.trim().replace('0', '') &&
          ward.DistrictID === ToDistrict.DistrictID
      );
      if (!ToWard)
        throw new BaseError({
          statusCode: 403,
          error: errorCode.client,
          errors: { address: errorCode['client.AddressIsNotValid'] }
        });
      const data = {
        shop_id: store.ghn_shop_id,
        to_district_id: ToDistrict.DistrictID,
        width: product.packaging_width,
        height: product.packaging_height,
        length: product.packaging_length,
        weight: product.packaging_weight,
        to_ward_code: ToWard.WardCode,
        service_type_id: 2
      };
      // const services = await this.api.getServices({
      //   from_district: FromDistrict.DistrictID,
      //   to_district: ToDistrict.DistrictID
      // });
      // console.log('service', services);
      // const selectedService = services.sort((a, b) => a.service_id - b.service_id);
      // console.log('selectedService', selectedService);
      // data.service_id = selectedService[0].service_id;
      const fee = await this.api.calculateFee(data, store.ghn_shop_id);
      console.log('fee', fee);
      return fee.total;
    } catch (error) {
      logger.error(error);
      if (error instanceof BaseError) throw error;
      throw new BaseError({
        statusCode: 500,
        error: errorCode.client,
        errors: { logistics: errorCode['client.logisticsIsUnavailable'] }
      });
    }
  }
  async confirmOrder({ order, note }) {
    try {
      logger.info('order, %o', order);
      const logisticsOrder = await this.api.createOrder(
        {
          payment_type_id: 1,
          note: note,
          client_order_code: order.code,
          to_name: order.delivery_address.receiver,
          to_phone: order.delivery_address.phone_number,
          to_address: order.delivery_address.normalizedAddress,
          cod_amount: order.is_paid ? 0 : order.total,
          required_note: 'KHONGCHOXEMHANG',
          ...order.logistics_info,
          content: order.products
            .map((product) => {
              return `${product.name} - ${product.quantity}`;
            })
            .toString(),
          insurance_value: order.original_total < 1e6 ? order.original_total : 1e6,
          return_phone: order.store_address.phone_number,
          return_address: order.store_address.normalizedAddress,
          return_district_id: order.logistics_info.from_district_id,
          return_ward_code: order.logistics_info.from_ward_code
        },
        order.logistics_info.shop_id
      );
      logger.info('logisticsOrder %o', logisticsOrder);
      order.waybill_code = logisticsOrder.order_code;
      order.expected_delivery_time = logisticsOrder.expected_delivery_time;
    } catch (error) {
      logger.info(error);
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { logistics: errorCode['client.logisticsIsUnavailable'] }
      });
    }
  }
  async getOrderFee(order) {
    const orderFee = await this.api.getOrderFee(
      { order_code: order.waybill_code },
      order.logistics_info.shop_id
    );
    return orderFee;
  }
  async getOrderInfo(order) {
    const orderInfo = await this.api.getOrderInfo(
      { order_code: order.waybill_code },
      order.logistics_info.shop_id
    );
    return orderInfo;
  }
}
