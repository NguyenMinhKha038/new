import configAPIs from './config';
import userAPIs from './user';
import companyAPIs from './company';
import authAPIs from './auth';
import adminAPIs from './admin';
import permissionAPIs from './permission';
import adminModAPIs from './admin-mod';
import permmisionGroupAPIs from './permission-group';
import bannerAPIs from './banner';
import categoryAPIs from './category';
import searchAPIs from './search';
import addressAPIs from './address';
import provinceAPIs from './province';
import storeAPIs from './store';
import productAPIs from './product';
import producV2tAPIs from './product-v2';
import settingAPIs from './setting';
import promotionAPIs from './promotion';
import promotionCodeAPIs from './promotion-code';
import cartAPIs from './cart';
import cartV2APIs from './cart-v2';
import luckyShoppingAPIs from './lucky-shopping';
import orderAPIs from './order';
import orderCachingAPIs from './order-caching';
import statisticAPIs from './statistic';
import revenueAPIs from './revenue';
import commentAPIs from './comment';
import rechargeAPIs from './recharge';
import transferAPIs from './transfer';
import transactionAPIs from './transaction';
import reportAPIs from './report';
import adminBankAPIs from './admin-bank';
import paymentCodeAPIs from './payment-code';
import notificationAPIs from './notification';
import productStoringAPIs from './product-storing';
import stockAPIs from './stock';
import productStockHistoryAPIs from './product-stock-history';
import userSMSAPIs from './user-sms';
import uploadImageAPIs from './upload-image';
import companyMoneyFlowAPIs from './company-money-flow';
import userHistoryAPIs from './user-history';
import companyHistoryAPIs from './company-history';
import logisticsAPIs from './logistics';
import chatAPIs from './chat';
import billAPIs from './bill';
import topupAPIs from './topup';
import userBankAPIs from './user-bank';
import companyBankAPIs from './company-bank';
import transactionCountAPIs from './transaction-count';
import behaviorAPIs from './user-behavior';
import recommendAPIs from './recommend';
import paymentGatewayAPIs from './payment-gateway';
import companyActivityAPIs from './company-activity';
import bankAPIS from './bank';
import globalPromotionAPIs from './global-promotion';
import globalPromotionRegistrationAPIs from './global-promotion-registration';
import cartV3APIs from './cart-v3';
import providerAPIs from './provider';
import warehouseStoringAPIs from './warehouse-storing';
import warehouseAPIs from './warehouse';
import mallStoringAPIs from './mall-storing';
import mallAPIs from './mall';
import mallStaffAPIs from './mall-staff';
import mallWorkScheduleAPIs from './mall-work-schedule';
import staffCheckInAPIs from './mall-staff-checkin';
import mallStaffStatisticAPIs from './mall-staff-statistic';
import goodsBatchAPIs from './goods-batch';
import companyScheduleAPIs from './company-schedule';
import companyScheduleV2APIs from './company-schedule-v2';
import mallActivityAPIs from './mall-activity';
import sellingOptionAPIs from './selling-option';
import buyerAPIs from './buyer';
import tagAPIs from './tag';
import groupAPIs from './group';
import productAttributeAPIs from './product-attribute';
import productTemplateAPIs from './product-template';
import productStockTrackingAPIs from './product-stock-tracking';
import stockCheckingAPIs from './stock-checking';
import stockCheckingItemAPIs from './stock-checking-item';

// [marker]: End imports

const paths = {
  ...configAPIs,
  ...userAPIs,
  ...companyAPIs,
  ...authAPIs,
  ...adminAPIs,
  ...permissionAPIs,
  ...adminModAPIs,
  ...permmisionGroupAPIs,
  ...bannerAPIs,
  ...categoryAPIs,
  ...searchAPIs,
  ...addressAPIs,
  ...provinceAPIs,
  ...storeAPIs,
  ...productAPIs,
  ...settingAPIs,
  ...promotionAPIs,
  ...promotionCodeAPIs,
  ...cartAPIs,
  ...cartV2APIs,
  ...cartV3APIs,
  ...luckyShoppingAPIs,
  ...orderAPIs,
  ...orderCachingAPIs,
  ...statisticAPIs,
  ...revenueAPIs,
  ...commentAPIs,
  ...rechargeAPIs,
  ...transferAPIs,
  ...transactionAPIs,
  ...reportAPIs,
  ...adminBankAPIs,
  ...paymentCodeAPIs,
  ...notificationAPIs,
  ...productStoringAPIs,
  ...stockAPIs,
  ...productStockHistoryAPIs,
  ...userSMSAPIs,
  ...uploadImageAPIs,
  ...companyMoneyFlowAPIs,
  ...userHistoryAPIs,
  ...companyHistoryAPIs,
  ...logisticsAPIs,
  ...chatAPIs,
  ...billAPIs,
  ...topupAPIs,
  ...userBankAPIs,
  ...companyBankAPIs,
  ...transactionCountAPIs,
  ...behaviorAPIs,
  ...recommendAPIs,
  ...paymentGatewayAPIs,
  ...companyActivityAPIs,
  ...mallAPIs,
  ...mallStaffAPIs,
  ...mallWorkScheduleAPIs,
  ...staffCheckInAPIs,
  ...mallStaffStatisticAPIs,
  ...bankAPIS,
  ...globalPromotionAPIs,
  ...globalPromotionRegistrationAPIs,
  ...providerAPIs,
  ...warehouseStoringAPIs,
  ...warehouseAPIs,
  ...mallStoringAPIs,
  ...mallAPIs,
  ...goodsBatchAPIs,
  ...companyScheduleAPIs,
  ...mallActivityAPIs,
  ...sellingOptionAPIs,
  ...buyerAPIs,
  ...tagAPIs,
  ...groupAPIs,
  ...companyScheduleV2APIs,
  ...productAttributeAPIs,
  ...productTemplateAPIs,
  ...producV2tAPIs,
  ...productStockTrackingAPIs,
  ...stockCheckingAPIs,
  ...stockCheckingItemAPIs
};

// [marker]: End paths

export default {
  openapi: '3.0.0',
  info: {
    description:
      '<i>This is unreleased documentation for SUM APIs doc <strong>2.0.0-next</strong> version. For stable version, use <strong>(1.1.0-stable)</strong></i> instead. <br/><i>&#95;&#95;<strong>From Backend Summoner With &#129505;&#95;&#95;</strong></i>',
    version: '2.0.0',
    title: 'SUM VIET API',
    termsOfService: '',
    contact: {}
  },
  paths,
  servers: [
    {
      description: 'Localhost',
      url: 'http://localhost:3000/api'
    }
  ],
  security: [
    {
      httpBearer: []
    }
  ],
  components: {
    securitySchemes: {
      httpBearer: {
        type: 'http',
        scheme: 'bearer'
      }
    },
    requestBodies: {
      Body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: {
                  type: 'string'
                },
                description: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      BodyResetPassword: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['phone, token, password'],
              properties: {
                phone: {
                  type: 'string'
                },
                token: {
                  type: 'string'
                },
                password: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    },
    userBankRes: {
      data: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string'
          },
          _id: { type: 'string' },
          name: { type: 'string' },
          branch: { type: 'string' },
          account_name: { type: 'string' },
          account_number: { type: 'string' },
          is_default: { type: 'boolean' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      },
      errors: {
        example: [
          {
            bank: '7002401',
            message: 'bank is existed',
            description: 'only exist in post api'
          },
          {
            user: '7001700',
            message: 'user is not found'
          }
        ]
      }
    },
    companyBankRes: {
      data: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string'
          },
          company_id: {
            type: 'string'
          },
          _id: { type: 'string' },
          name: { type: 'string' },
          branch: { type: 'string' },
          account_name: { type: 'string' },
          account_number: { type: 'string' },
          is_default: { type: 'boolean' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      },
      errors: {
        example: [
          {
            bank: '7002401',
            message: 'bank is existed',
            description: 'only exist in post api'
          },
          {
            permisison: '5000102',
            message: 'permission is not allowed'
          },
          {
            company: '7000100',
            message: 'company is not existed'
          }
        ]
      }
    },
    depositWithdraw: {
      data: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string'
          },
          company_id: {
            type: 'string'
          },
          cashier_id: {
            type: 'string'
          },
          type: {
            type: 'string',
            valid: 'deposit, withdraw, deposit_company, withdraw_company'
          },
          value: {
            type: 'number'
          },
          fee: {
            type: 'number'
          },
          refund: {
            type: 'number'
          },
          admin_bank_id: {
            type: 'string',
            description: 'exist when type is withdraw or withdraw_company'
          },
          company_bank_id: {
            type: 'string',
            description: 'exist when type is deposit_company'
          },
          user_bank_id: {
            type: 'string',
            description: 'exist when type is deposit'
          },
          obl_balance: {
            type: 'number'
          },
          new_balance: {
            type: 'number'
          },
          status: {
            type: 'string'
          },
          payment_type: {
            type: 'string',
            valid: 'manual'
          },
          code: {
            type: 'string'
          },
          sms_message: {
            type: 'string'
          },
          bill_image: {
            type: 'string'
          }
        }
      }
    }
  }
};
