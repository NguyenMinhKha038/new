import databaseService from '../database/database.service';
import Bluebird from 'bluebird';

export const topup = {
  1: {
    2: (config) => {
      console.log('\u2605 update config combo for fast topup');
      config.version = 2;
      config.value.refund_rate.fast = config.value.refund_rate.slow;
      config.markModified('value');
    }
  },
  2: {
    3: (config) => {
      console.log('\u2605 add amount type and add is_active properties');
      config.version = 3;
      config.value.amounts.unshift(20000);
      config.value.amounts = config.value.amounts.map((amount) => {
        return { amounts: amount, is_active: true };
      });
      config.value.combos = config.value.combos.map((combo) => {
        return { ...combo, is_active: true };
      });
      for (let type in config.value.refund_rate) {
        for (let level in config.value.refund_rate[type]) {
          for (let provider in config.value.refund_rate[type][level]) {
            if (provider) {
              config.value.refund_rate[type][level][provider]['20000'] = 0.01;
            }
          }
        }
      }
      config.markModified('value');
    }
  },
  3: {
    4: (config) => {
      console.log('\u2605 add publisher status to top up amounts');
      config.version = 4;
      const publishers_status = {
        VTT: true,
        VNM: true,
        VNP: true,
        VMS: true,
        GMB: true
      };
      config.value.amounts.map((amount) => (amount.publishers_status = publishers_status));
      config.markModified('value');
    }
  }
};

export const bill_electric = {
  1: {
    2: (config) => {
      console.log('\u2605 fix typo env to evn');
      config.version = 2;
      config.value.publishers.forEach((publisher) => {
        publisher.logo = publisher.logo.replace('env', 'evn');
      });
      config.markModified('value');
    }
  },
  2: {
    3: (config) => {
      console.log('\u2605 fix test up v3');
      config.version = 3;
      config.value.publishers.forEach((publisher) => {
        publisher.logo = publisher.logo.replace('jpeg', 'jpeg');
      });
      config.markModified('value');
    }
  }
};

export const company_limit = {
  1: {
    2: (config) => {
      console.log('\u2605 add negative balance');
      config.version = 2;
      config.value.forEach((v) => {
        if (!v.negative_balance) v.negative_balance = 100e3;
      });
      config.markModified('value');
    }
  }
};

export const db_version = {
  1: {
    2: async (config) => {
      const database = await databaseService.connect();
      console.log('\u2605 update pure name for text search');
      const updatesCollections = [
        's_companies',
        's_stores',
        'users',
        's_categories',
        's_products',
        's_promotions'
      ];
      await Bluebird.each(updatesCollections, async (collection) => {
        const coll = database.connection.collection(collection);
        const docs = await coll.find({}).toArray();
        for (const doc of docs) {
          const name = doc.name;
          const pureName = name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
          await coll.findOneAndUpdate(
            { _id: doc._id },
            {
              $set: {
                pure_name: pureName
              }
            }
          );
        }
        console.log(`Updated [${collection}]!`);
      });
      config.version = 2;
      config.value = 2;
    }
  },
  2: {
    3: async (config) => {
      const database = await databaseService.connect();
      console.log('\u2605 update active status for productStoring');
      const productStoringCollection = database.connection.collection('s_product_storings');
      const storeCollection = database.connection.collection('s_stores');
      await productStoringCollection.updateMany({}, { $set: { active: true } });
      const stores = await storeCollection.find({}).toArray();
      for (const store of stores) {
        const totalProduct = await productStoringCollection.countDocuments({
          store_id: store._id
        });
        await storeCollection.findOneAndUpdate(
          { _id: store._id },
          {
            $set: { active_product: totalProduct, total_product: totalProduct }
          }
        );
      }
      config.version = 3;
      config.value = 3;
    }
  },
  3: {
    4: async (config) => {
      const database = await databaseService.connect();
      const companyPermissionCollection = database.connection.collection('s_permissions');
      const permissionList = await companyPermissionCollection.find({}).toArray();
      if (!permissionList || !permissionList.length || permissionList[0].path) {
        await companyPermissionCollection.deleteMany({});
        const newPermissionList = require('../../../assets/company-permission.json');
        companyPermissionCollection.insertMany(newPermissionList);
      }
      config.version = 4;
      config.value = 4;
    }
  },
  4: {
    5: async (config) => {
      const database = await databaseService.connect();
      const permissionGroupCollection = database.connection.collection('s_permission_groups');
      const productStockHistoryCollection = database.connection.collection(
        's_product_stock_histories'
      );
      const PSHColl = productStockHistoryCollection;
      const PGColl = permissionGroupCollection;

      const histories = await PSHColl.find({ performed_by_id: { $ne: null } }).toArray();
      // use for loop instead of Promise.all
      for (const history of histories) {
        const permission = await PGColl.findOne({
          status: 'active',
          user_id: history.performed_by_id,
          company_id: history.company_id
        });
        if (permission) {
          const updates = {};
          const { is_owner = false, store_id } = permission;
          updates.performed_by_owner = is_owner;
          store_id && (updates.performed_store_id = store_id);
          await PSHColl.findOneAndUpdate({ _id: history._id }, { $set: updates });
        }
      }
      config.version = 5;
      config.value = 5;
    }
  }
};
