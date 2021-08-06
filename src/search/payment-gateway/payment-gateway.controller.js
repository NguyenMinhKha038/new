// import { BaseError, errorCode } from '../../commons/utils';
import { vnPay } from '.';
import cartService, { populateOptions } from '../cart/cart.service';
import { Promise } from 'bluebird';
import { userService } from '../../commons/user';
import cartHandler from '../cart/cart.handler';
import fs from 'fs';
import path from 'path';
import depositWithdrawService from '../deposit-withdraw/deposit-withdraw.service';
import userHistoryService from '../user-history/user-history.service';
import companyHistoryService from '../company-history/company-history.service';
import { BaseError, BaseResponse, currencyFormat, errorCode, logger } from '../../commons/utils';
import moment from 'moment';
import alePay from './alepay';

const billingInformation = fs.readFileSync(
  path.join(__dirname, '../../../assets/billing-information.html'),
  'utf8'
);

export default {
  vnpay: {
    /**
     *
     * @param {*} req
     * @param {import('express').Response} res
     * @param {*} next
     */
    async return(req, res, next) {
      try {
        const isValid = vnPay.validatePayment(req.query);
        /** @type {[SPaymentType, string]} */
        const [type, code] = req.query.vnp_TxnRef.split('.');

        let data = '';

        if (!isValid || req.query.vnp_ResponseCode !== '00') {
          data = billingInformation
            .replace(/_color_/g, '#b70000')
            .replace('_mark_', '&#10005;')
            .replace('_status_', 'Thất bại')
            .replace('_info1_', code ? `Mã đơn hàng: ${code}` : req.query.vnp_TxnRef)
            .replace(
              '_info2_',
              `Thời gian: ${moment(req.query.vnp_PayDate, 'YYYYMMDDHHmmss').format(
                'DD/MM/YYYY hh:mm'
              )}`
            )
            .replace(
              '_info3_',
              `Số tiền: ${currencyFormat(req.query.vnp_Amount / 100, undefined, ' VND')}`
            )
            .replace('_info4_', `Nội dung: Thông tin thanh toán không hợp lệ!`);
        } else {
          data = billingInformation
            .replace(/_color_/g, '#88b04b')
            .replace('_mark_', '&#10004;')
            .replace('_status_', 'Thành công')
            .replace('_info1_', `Mã đơn hàng: ${code}`)
            .replace(
              '_info2_',
              `Thời gian: ${moment(req.query.vnp_PayDate, 'YYYYMMDDHHmmss').format(
                'DD/MM/YYYY hh:mm'
              )}`
            )
            .replace(
              '_info3_',
              `Số tiền: ${currencyFormat(req.query.vnp_Amount / 100, undefined, ' VND')}`
            )
            .replace('_info4_', `Nội dung: ${req.query.vnp_OrderInfo}!`);
        }
        switch (type) {
          case 'pay_cart':
            {
              const cart = await cartService.findOne(
                { is_checkouted: true, code: code },
                {
                  populate: Object.values(populateOptions)
                }
              );
              if (!cart) {
                data = billingInformation
                  .replace(/_color_/g, '#88b04b')
                  .replace('_mark_', '&#10004;')
                  .replace('_status_', 'Lỗi')
                  .replace('_info1_', `Mã đơn hàng: ${code}`)
                  .replace(
                    '_info2_',
                    `Thời gian: ${moment(req.query.vnp_PayDate, 'YYYYMMDDHHmmss').format(
                      'DD/MM/YYYY hh:mm'
                    )}`
                  )
                  .replace(
                    '_info3_',
                    `Số tiền: ${currencyFormat(req.query.vnp_Amount / 100, undefined, ' VND')}`
                  )
                  .replace('_info4_', `Nội dung: Đơn hàng không được tìm thấy!`);
              } else {
                await Promise.map(cart.orders, async (order) => {
                  await order.getPromotionCode();
                  order.getPrice();
                });
                cart.getTotal();
                if (Math.round(cart.total * 100) !== +req.query.vnp_Amount) {
                  data = billingInformation
                    .replace(/_color_/g, '#88b04b')
                    .replace('_mark_', '&#10004;')
                    .replace('_status_', 'Lỗi')
                    .replace('_info1_', `Mã đơn hàng: ${code}`)
                    .replace(
                      '_info2_',
                      `Thời gian: ${moment(req.query.vnp_PayDate, 'YYYYMMDDHHmmss').format(
                        'DD/MM/YYYY hh:mm'
                      )}`
                    )
                    .replace(
                      '_info3_',
                      `Số tiền: ${currencyFormat(req.query.vnp_Amount / 100, undefined, ' VND')}`
                    )
                    .replace('_info4_', `Nội dung: Số tiền thanh toán không hợp lệ!`);
                }
              }
            }
            break;
          case 'deposit':
            data = data.replace('_info2_', 'Giao dịch mua điểm của bạn đang được xử lý');
            break;
          default:
            data = billingInformation
              .replace(/_color_/g, '#b70000')
              .replace('_mark_', '&#10005;')
              .replace('_status_', 'Lỗi')
              .replace('_info1_', `Mã đơn hàng: ${req.query.vnp_TxnRef}`)
              .replace(
                '_info2_',
                `Thời gian: ${moment(req.query.vnp_PayDate, 'YYYYMMDDHHmmss').format(
                  'DD/MM/YYYY hh:mm'
                )}`
              )
              .replace(
                '_info3_',
                `Số tiền: ${currencyFormat(req.query.vnp_Amount / 100, undefined, ' VND')}`
              )
              .replace('_info4_', `Nội dung: Đơn hàng không được tìm thấy!`);
            break;
        }
        data = data.replace(/_info.+/g, '');
        return res.send(data);
      } catch (error) {
        next(error);
      }
    },
    async ipn(req, res, next) {
      try {
        const isValid = vnPay.validatePayment(req.query);
        if (!isValid) return res.status(200).json(responseError.failedChecksum);
        if (req.query.vnp_ResponseCode !== '00')
          return res.status(200).json({ RspCode: '00', Message: 'Failed Transaction' });
        let response;
        /** @type {[SPaymentType, string]} */
        const [type, code] = req.query.vnp_TxnRef.split('.');
        const {
          vnp_BankCode,
          vpn_PayDate,
          vnp_Amount,
          vnp_CardType,
          vnp_BackTranNo,
          vnp_TransactionNo,
          vnp_TxnRef
        } = req.query;
        switch (type) {
          case 'pay_cart': {
            const cart = await cartService.findOne(
              { is_checkouted: true, code: code },
              {
                populate: Object.values(populateOptions)
              }
            );
            if (!cart) return res.status(200).json(responseError.notFound);
            if (cart.is_confirmed) return res.status(200).json(responseError.handled);
            // TODO: Check Total again
            await Promise.map(cart.orders, async (order) => {
              await order.getPromotionCode();
              order.getPrice();
            });
            cart.getTotal();

            if (Math.round(cart.total * 100) !== +req.query.vnp_Amount) {
              return res.status(200).json(responseError.inValidAmount);
            }
            const user = await userService.findOne({ _id: cart.user_id });
            await cartHandler.handleConfirm({ cart, is_paid: true, user });
            break;
          }
          case 'deposit': {
            const transaction = await depositWithdrawService.findOne({ code });
            if (!transaction) {
              return res.status(200).json(responseError.notFound);
            }
            const {
              type,
              value,
              refund: refundValue,
              _id: transaction_id,
              status: transaction_status,
              user_id
            } = transaction;
            if (transaction_status !== 'pending') {
              return res.status(200).json(responseError.handled);
            }
            if (Math.round(transaction.value * 100) !== parseInt(vnp_Amount)) {
              return res.status(200).json(responseError.inValidAmount);
            }

            /**
             * @type {DepWithVnpData} */
            const vnp_data = {
              vnp_Amount,
              vnp_BackTranNo,
              vnp_BankCode,
              vnp_CardType,
              vnp_TransactionNo,
              vnp_TxnRef,
              vpn_PayDate,
              bank: vnp_BankCode
            };
            /**@type {DepWithConfirm} */
            const DepWithConfirmData = {
              type,
              refundValue,
              transaction_id,
              status: 'success',
              value,
              vnp_data
            };
            if (transaction.type === 'deposit') {
              await depositWithdrawService.confirmUserTransaction(user_id, DepWithConfirmData);
              userHistoryService.create({
                user_id,
                onModel: 's_deposit_withdraw',
                value,
                transaction_id,
                type: 'deposit'
              });
            } else if (transaction.type === 'deposit_company') {
              const response = await depositWithdrawService.confirmCompanyTransaction(
                transaction.company_id,
                DepWithConfirmData
              );
              companyHistoryService.create({
                user_id,
                type: 'deposit',
                company_id: transaction.company_id,
                new_balance: response.new_balance,
                transaction_id,
                value,
                onModel: 's_deposit_withdraw'
              });
            }
            break;
          }

          default:
            return res.status(200).json(responseError.notFound);
        }

        res.status(200).json(responseError.success);
      } catch (error) {
        logger.error(error);
        res.status(200).json(responseError.internalError);
      }
    }
  },
  alepay: {
    async return(req, res, next) {
      try {
        const query = req.query;
        const dataDecoded = Buffer.from(query.data, 'base64').toString();
        const isValid = alePay.validatePayment(dataDecoded, query.checksum);
        const result = isValid && alePay.decryptData(dataDecoded);
        console.log('result', result);
        // TODO: Check Total again
        const messageCode = result && result.errorCode;
        const message = alePayResponseMessage[messageCode];
        let data = billingInformation
          .replace(/_color_/g, '#b70000')
          .replace('_mark_', '&#10005;')
          .replace('_status_', 'Thất bại')
          .replace('_info1_', cart ? `Mã đơn hàng: ${cart.code}` : '')
          .replace('_info2_', `Thời gian: ${moment().format('DD/MM/YYYY hh:mm')}`)
          .replace('_info3_', cart ? `Số tiền: ${cart.total}` : '')
          .replace('_info4_', `Nội dung: ${message}`);
        if (!result || result.cancel) {
          data = billingInformation
            .replace(/_color_/g, '#b70000')
            .replace('_mark_', '&#10005;')
            .replace('_status_', 'Thất bại')
            .replace('_info1_', cart ? `Mã đơn hàng: ${cart.code}` : '')
            .replace('_info2_', `Thời gian: ${moment().format('DD/MM/YYYY hh:mm')}`)
            .replace('_info3_', cart ? `Số tiền: ${cart.total}` : '')
            .replace('_info4_', `Nội dung: Thông tin thanh toán không hợp lệ!`);
          data = data.replace(/_info.+/g, '');
          return res.send(data);
        }
        const cart = await cartService.findOne(
          { is_checkouted: true, receipt_code: result.data },
          {
            populate: Object.values(populateOptions)
          }
        );
        if (!cart) {
          data = billingInformation
            .replace(/_color_/g, '#b70000')
            .replace('_mark_', '&#10005;')
            .replace('_status_', 'Thất bại')
            .replace('_info1_', cart ? `Mã đơn hàng: ${cart.code}` : '')
            .replace('_info2_', `Thời gian: ${moment().format('DD/MM/YYYY hh:mm')}`)
            .replace('_info3_', cart ? `Số tiền: ${cart.total}` : '')
            .replace('_info4_', `Nội dung: Đơn hàng không được tìm thấy!`);
        } else {
          if (cart.is_confirmed) {
            data = billingInformation
              .replace(/_color_/g, '#88b04b')
              .replace('_mark_', '&#10004;')
              .replace('_status_', 'Thành công')
              .replace('_info1_', `Mã đơn hàng: ${cart.code}`)
              .replace('_info2_', `Thời gian: ${moment().format('DD/MM/YYYY hh:mm')}`)
              .replace('_info3_', `Số tiền: ${currencyFormat(cart.total, undefined, ' VND')}`)
              .replace('_info4_', `Nội dung: Đơn hàng đã được xử lý!`);
          } else if (result.errorCode === '000') {
            const user = await userService.findOne({ _id: cart.user_id });
            await cartHandler.handleConfirm({ cart, is_paid: true, user });
            data = billingInformation
              .replace(/_color_/g, '#88b04b')
              .replace('_mark_', '&#10004;')
              .replace('_status_', 'Thành công')
              .replace('_info1_', `Mã đơn hàng: ${cart.code}`)
              .replace('_info2_', `Thời gian: ${moment().format('DD/MM/YYYY hh:mm')}`)
              .replace('_info3_', `Số tiền: ${currencyFormat(cart.total, undefined, ' VND')}`)
              .replace('_info4_', `Nội dung: Thanh toán thành công!`);
          }
        }
        return res.send(data);
      } catch (error) {
        next(error);
      }
    },
    async restore(req, res, next) {
      try {
        /**
         * @type {{code: string, type: keyof typeof import('./payment-gateway.config').PaymentTypes}}
         */
        const { code, type } = req.body;
        switch (type) {
          case 'pay_cart': {
            const cart = await cartService.findOne(
              {
                code: code,
                is_checkouted: true,
                is_confirmed: false
              },
              {
                populate: [
                  populateOptions.detail,
                  populateOptions.storing,
                  populateOptions.company,
                  populateOptions.storing_detail
                ]
              }
            );
            if (!cart)
              throw new BaseError({
                statusCode: 404,
                error: errorCode.client,
                errors: { cart: errorCode['client.cartNotExist'] }
              });
            const receipt = await alePay.getTransactionInfo(cart.receipt_code);
            if (receipt.status === '000') {
              const user = await userService.findActive(cart.user_id);
              await cartHandler.handleConfirm({ cart, is_paid: true, user });
              return new BaseResponse({ statusCode: 200, data: cart }).return(res);
            }
            throw new BaseError({
              statusCode: 403,
              error: errorCode.client,
              errors: { pay: errorCode['server.thirdPartyError'] },
              message: receipt.message
            });
          }

          default:
            break;
        }
      } catch (error) {
        next(error);
      }
    },
    async cancel(req, res, next) {
      try {
        let data = billingInformation
          .replace(/_color_/g, '#b70000')
          .replace('_mark_', '&#10004;')
          .replace('_status_', 'Từ chối thanh toán')
          .replace(/_info.+/g, '');
        return res.send(data);
      } catch (error) {
        next(error);
      }
    }
  }
};

const responseError = {
  success: { RspCode: '00', Message: 'Ghi nhận giao dịch thành công' },
  notFound: { RspCode: '01', Message: 'Không tìm thấy mã đơn hàng' },
  handled: { RspCode: '02', Message: 'Yêu cầu đã được xử lý trước đó' },
  bannedIp: { RspCode: '03', Message: 'Địa chỉ IP không được phép truy cập (tùy chọn)' },
  inValidAmount: { RspCode: '04', Message: 'Số tiền thanh toán không hợp lệ' },
  failedChecksum: { RspCode: '97', Message: 'Sai chữ ký (checksum không khớp)' },
  internalError: { RspCode: '99', Message: 'Lỗi hệ thống' }
};

const alePayResponseMessage = {
  '000': 'Thành công',
  '101': 'Checksum không hợp lệ',
  '102': 'Mã hóa không hợp lệ',
  '103': 'IP không được phép truy cập',
  '104': 'Dữ liệu không hợp lệ',
  '105': 'Token key không hợp lệ',
  '106': 'Token thanh toán Alepay không tồn tại hoặc đã bị hủy',
  '107': 'Giao dịch đang được xử lý',
  '108': 'Dữ liệu không tìm thấy',
  '109': 'Mã đơn hàng không tìm thấy',
  '110': 'Phải có email hoặc số điện thoại người mua',
  '111': 'Giao dịch thất bại',
  '120': 'Giá trị đơn hàng phải lớn hơn 0',
  '121': 'Loại tiền tệ không hợp lệ',
  '122': 'Mô tả đơn hàng không tìm thấy',
  '123': 'Tổng số sản phẩm phải lớn hơn không',
  '124': 'Định dạng URL không chính xác (http://, https://)',
  '125': 'Tên người mua không đúng định dạng',
  '126': 'Email người mua không đúng định dạng',
  '127': 'SĐT người mua không đúng định dạng',
  '128': 'Địa chỉ người mua không hợp lệ',
  '129': 'City người mua không hợp lệ',
  '130': 'quốc gia người mua không hợp lệ',
  '131': 'hạn thanh toán phải lớn hơn 0',
  '132': 'Email không hợp lệ',
  '133': 'Thông tin thẻ không hợp lệ',
  '134': 'Thẻ hết hạn mức thanh toán',
  '135': 'Giao dịch bị từ chối bởi ngân hàng phát hành thẻ',
  '136': 'Mã giao dịch không tồn tại',
  '137': 'Giao dịch không hợp lệ',
  '138': 'Tài khoản Merchant không tồn tại',
  '139': 'Tài khoản Merchant không hoạt động',
  '140': 'Tài khoản Merchant không hợp lệ',
  '142': 'Ngân hàng không hỗ trợ trả góp',
  '143': 'Thẻ không được phát hành bởi ngân hàng đã chọn',
  '144': 'Kỳ thanh toán không hợp lệ',
  '145': 'Số tiền giao dịch trả góp không hợp lệ',
  '146': 'Thẻ của bạn không thuộc ngân hang hỗ trợ trả góp',
  '147': 'Số điện thoại không hợp lệ',
  '148': 'Thông tin trả góp không hợp lệ',
  '149': 'Loại thẻ không hợp lệ',
  '150': 'Thẻ bị review',
  '151': 'Ngân hàng không hỗ trợ thanh toán',
  '152': 'Số thẻ không phù hợp với loại thẻ đã chọn',
  '153': 'Giao dịch không tồn tại',
  '154': 'Số tiền vượt quá hạn mức cho phép',
  '155': 'Đợi người mua xác nhận trả góp',
  '156': 'Số tiền thanh toán không hợp lệ',
  '157': 'email không khớp với profile đã tồn tại',
  '158': 'số điện thoại không khớp với profile đã tồn tại',
  '159': 'Id không được để trống',
  '160': 'First name không được để trống',
  '161': 'Last name không được để trống',
  '162': 'Email không được để trống',
  '163': 'city không được để trống',
  '164': 'country không được để trống',
  '165': 'SĐT Không được để trống',
  '166': 'state không được để trống',
  '167': 'street không được để trống',
  '168': 'postalcode không được để trống',
  '169': 'url callback không đươc để trống',
  '170': 'otp nhập sai quá 3 lần',
  '171': 'Thẻ của khách hàng đã được liên kết trên Merchant',
  '172': 'thẻ tạm thời bị cấm liên kết do vượt quá số lần xác thực số tiền',
  '173': 'trạng thái liên kết thẻ không đúng',
  '174': 'không tìm thấy phiên liên kết thẻ',
  '175': 'số tiền thanh toán của thẻ 2D chưa xác thực vượt quá hạn mức',
  '176': 'thẻ 2D đang chờ xác thực',
  '177': 'khách hàng ấn nút hủy giao dịch',
  '178': 'thanh toán subscription thành công',
  '179': 'thanh toán subscription thất bại',
  '180': 'đăng ký subscription thành công',
  '181': 'đăng ký subscription thất bại',
  '182': 'Mã Alepay token không hợp lệ',
  '183': 'Mã plan không được trống',
  '184': 'URL callback không được trống',
  '185': 'Subscription Plan không tồn tại',
  '186': 'Subscription plan không kích hoạt',
  '187': 'Subscription plan hết hạn',
  '188': 'Subscription Record đã tồn tại',
  '189': 'Subscription Record không tồn tại',
  '190': 'Trạng thái Subscription Record không hợp lệ',
  '191': 'Xác thực OTP quá số lần cho phép',
  '192': 'Sai OTP xác thực',
  '193': 'Đăng ký subscription cho khách hàng thành công',
  '194': 'Khách hàng cần confirm subscription',
  '195': 'Trạng thái Alepay token không hợp lệ',
  '196': 'Gửi OTP không thành công',
  '197': 'Ngày kết thúc hoặc số lần thanh toán tối đa không hợp lệ',
  '198': 'Alepay token không được để trống',
  '199': 'Alepay token chưa được active',
  '200': 'Subscription Plan không hợp lệ',
  '201': 'thời gian bắt đầu không hợp lệ',
  '202': 'IP request của merchant chưa được cấu hình hoặc không được cho phép',
  '203': 'không tìm thấy file subscription',
  '204': 'Alepay token chưa được xác thực',
  '205': 'tên chủ thẻ không hợp lệ',
  '206': 'Merchant không được phép sử dụng dịch vụ này',
  '207': 'Ngân hàng nội địa không hợp lệ',
  '208': 'Mã token xác thực không hợp lệ',
  '209': 'Số tiền xác thực không hợp lệ',
  '210': 'Quá số lần xác thực số tiền',
  '211': 'Tên người mua phải bao gồm cả họ và tên',
  '212': 'Merchant không được phép liên kết thẻ',
  '213': 'Khách hàng không lựa chọn liên kết thẻ',
  '214': 'Giao dịch chưa được thực hiện',
  '215': 'Không duyệt thẻ bị review',
  '216': 'Thẻ không được hỗ trợ thanh toán',
  '217': 'Profile khách hàng không tồn tại trên hệ thống',
  '220': 'Giao dịch đã được hoàn',
  '221': 'Giao dịch đã tạo yêu cầu hoàn',
  '222': 'Giao dịch hoàn đang được xử lý',
  '223': 'Giao dịch trả góp không được hoàn',
  '224': 'Yêu cầu hoàn tiền đã bị hủy',
  '226': 'Mã chương trình khuyến mãi không hợp lệ',
  '227': 'Chờ merchant confirm (Chỉ dành riêng cho robin)',
  '228': 'Ngân hàng không hỗ trợ trả góp trong ngày sao kê',
  '229': 'Thẻ đã hết hạn sử dụng, vui lòng liên hệ ngân hàng phát hành thẻ để biết thêm chi tiết',
  '230': 'Thẻ không được phép liên kết',
  '231': 'Trạng thái giao dịch không đúng',
  '232': 'Lỗi kết nối tới ngân hàng',
  '233': 'Mã tham chiếu cho giao dịch hoàn tiền đã được ghi nhận trên alepay trước đó.',
  '234': 'Tổng số tiền hoàn vượt quá tổng số tiền thanh toán',
  '240': 'Họ tên người mua không được chứa ký tự số',
  '999': 'Lỗi không xác định. Vui lòng liên hệ với Quản trị viên Alepay'
};
