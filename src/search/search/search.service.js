import request from 'request-promise';
import { removeAccents } from '../../commons/utils/utils';
import { logger } from '../../commons/utils';

export const searchService = {
  async getCoordinates(address) {
    try {
      const data = await request.get('https://geocoder.ls.hereapi.com/6.2/geocode.json', {
        qs: {
          searchtext: address,
          apiKey: process.env.HERE_API_KEY
        },
        json: true
      });
      if (data.Response.View) {
        return [
          data.Response.View[0].Result[0].Location.DisplayPosition.Longitude,
          data.Response.View[0].Result[0].Location.DisplayPosition.Latitude
        ];
      }
    } catch (error) {
      logger.error('error when getCoordiates', error);
    }
  },
  async getDistance(coor0, coor1) {
    try {
      let newCoor0 = coor0.slice();
      let newCoor1 = coor1.slice();
      const data = await request.get(
        'https://route.ls.hereapi.com/routing/7.2/calculateroute.json',
        {
          qs: {
            apiKey: process.env.HERE_API_KEY,
            waypoint0: `geo!${newCoor0.reverse().toString()}`,
            waypoint1: `geo!${newCoor1.reverse().toString()}`,
            mode: `fastest;car;traffic:disabled`
          },
          json: true
        }
      );
      return data.response.route[0].summary.distance;
    } catch (error) {
      logger.error('error when getDistance', error);
    }
  },
  async autoComplete({ query, location }) {
    try {
      const data = await request.get(
        'https://autocomplete.geocoder.ls.hereapi.com/6.2/suggest.json',
        {
          qs: {
            apiKey: process.env.HERE_API_KEY,
            query,
            country: 'VNM',
            prox: location
          },
          json: true
        }
      );
      return data.suggestions.map((suggestion) => ({
        address: (
          suggestion.address.houseNumber +
          ', ' +
          suggestion.address.street +
          ', ' +
          suggestion.address.district +
          ', ' +
          suggestion.address.city +
          ', ' +
          suggestion.address.county
        ).replace(/undefined, /g, ''),
        distance: suggestion.distance
      }));
    } catch (error) {
      logger.error(error);
    }
  },
  async getAddress(location) {
    try {
      const data = await request.get(
        'https://reverse.geocoder.ls.hereapi.com/6.2/reversegeocode.json',
        {
          qs: {
            apiKey: process.env.HERE_API_KEY,
            prox: location,
            country: 'VNM',
            mode: 'retrieveAddresses',
            minresults: 1
          },
          json: true
        }
      );
      return data.Response.View[0].Result[0].Location.Address.Label;
    } catch (error) {
      logger.error(error);
    }
  },
  async getAddressDetails(type = 'Point', query) {
    try {
      const api =
        type === 'Point'
          ? 'https://reverse.geocoder.ls.hereapi.com/6.2/reversegeocode.json'
          : 'https://geocoder.ls.hereapi.com/6.2/geocode.json';
      const subQs =
        type === 'Point'
          ? {
              prox: query.latitude + ',' + query.longitude,
              country: query.country || 'VNM',
              mode: query.mode || 'retrieveAddresses',
              minresults: query.minresults || 1
            }
          : { searchtext: query.address };
      const data = await request.get(api, {
        qs: {
          apiKey: process.env.HERE_API_KEY,
          ...subQs
        },
        json: true
      });

      const rawData = data.Response.View[0].Result[0].Location;
      console.log(rawData);
      const { DisplayPosition, Address } = rawData;
      const formattedData = {
        latitude: DisplayPosition.Latitude,
        longitude: DisplayPosition.Longitude,
        country_code: Address.Country,
        province: Address.County || Address.City,
        _province: removeAccents(Address.County || Address.City, true),
        address: Address.Label,
        _address: removeAccents(Address.Label),
        raw_address: query.address,
        _raw_address: removeAccents(query.address)
      };

      return { raw_data: rawData, data: formattedData };
    } catch (error) {
      logger.error('getAddressDetails error: %o', err);
      return { raw_data: null, data: null };
    }
  }
};
