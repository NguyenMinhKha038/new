/**
 * @typedef {object} VimoResponse
 * @property {'00'|'01'|'02'|'03'|'04'|'05'|'06'|'07'|'08'|'09'|'20'|'21'|'22'|'23'|'24'|'25'|'26'|'27'|'28'|'29'|'30'|'31'|'32'|'98'|'99'} error_code
 * @property {string} error_message
 * @property {string} merchant_code
 * @property {string} checksum
 * @property {{}} data
 */
/**
 * @typedef {object} VimoTopUpData
 * @property {object} data
 * @property {string} data.transaction_id
 */
/**
 * @typedef {object} VimoGetBalanceData
 * @property {object} data
 * @property {number} data.balance
 * @property {number} data.balance_holding
 */
/**
 * @typedef {object} VimoBillData
 * @property {object} data
 * @property {number} data.transaction_id
 * @property {object[]} data.billDetail
 * @property {string} data.billDetail.billNumber
 * @property {string} data.billDetail.period
 * @property {number} data.billDetail.amount
 * @property {string} data.billDetail.billType
 * @property {string} data.billDetail.billOtherInfo
 * @property {object} data.customerInfo
 * @property {string} data.customerInfo.customerCode
 * @property {string} data.customerInfo.customerName
 * @property {string} data.customerInfo.customerAddress
 * @property {string} data.customerInfo.customerOtherInfo
 */
/**
 * @typedef {'BILL_ELECTRIC'|'BILL_FINANCE'|'BILL_WATER'} VimoBillServiceCode
 */
/**
 * @typedef {20000|10000|30000|50000|100000|200000|300000|500000} VimoTopUpAmount
 * @typedef {'VTT'|'VNP'|'VMS'|'VNM'|'GMB'} VimoTopUpPublisher
 */
/*
* SERVICE_CODE
- TOPUP_TELCO_PREPAID : Nạp tiền điện thoại trả trước
- TOPUP_TELCO_POSTPAID: Nạp tiền điện thoại trả sau
- TOPUP_GAME          : Nạp tiền tài khoản game
- PINCODE_TELCO       : Mua mã thẻ điện thoại
- PINCODE_GAME        : Mua mã thẻ Game
- TICKET_TRAIN        : Mua vé tàu – Đường sắt Việt Nam
- BILL_ELECTRIC       : Thanh toán hóa đơn điện EVN
- BILL_FINANCE        : Thanh toán tài chính
- BILL_WATER          : Thanh toán hóa đơn nước
===============================
* TOP_UP AMOUNT 
- 20000 : Mệnh giá 20.000
- 10000 : Mệnh giá 10.000
- 30000 : Mệnh giá 30.000
- 50000 : Mệnh giá 50.000
- 100000: Mệnh giá 100.000
- 200000: Mệnh giá 200.000
- 300000: Mệnh giá 300.000
- 500000: Mệnh giá 500.000

* PUBLISHER
+ TOP_UP
- VTT: Viettel
- VNP: VinaPhone
- VMS: MobiFone
- VNM: Vietnamobile
- GMB: Gmobile

+ BILL_ELECTRIC
- EVN   : Điện lực Hà Nội
- EVNHCM: Điện lực Hồ Chí Minh
    PE15000345818
    PE15000345827
    PE15000345823
- EVNNPC: Điện lực Miền Bắc
- EVNCPC: Điện lực Miền Trung
- EVNSPC: Điện lực Miền Nam

+ BILL_FINANCE
- MCR         : Mcredit
- ACS         : ACS
- MRA         : Mirae Asset
- HCR         : Home Credit
- FECR        : FE Credit
- OCB         : Ngân hàng Phương Đông
- Intergration: Document
- MSB         : Ngân hàng Hàng Hải
- PRU         : Prudential
- DTD         : DoctorDong


// -  QNA    : Cty nước Quảng Nam
- HCMTA  : Cty nước Trung An – TP.HCM
- HCMCLO : Cty nước Chợ Lớn – TP.HCM
- HCMNT  : Cty nước Nông thôn – TP.HCM
// - VP     : Cty nước Vĩnh Phúc
- NBE    : Cty nước Nhà Bè
- BRVT   : Cty nước Bà Rịa - Vũng Tàu
- DNI    : Cty nước Đồng Nai
- DNINT  : Cty nước Nhơn Trạch – Đồng Nai
- BDU    : Cty nước Bình Dương
- CTO    : Cty nước Cần Thơ
// - HCM    : Cty nước TP Hồ Chí Minh
- HCMBT  : Cty nước Bến Thành – TP.HCM
- CTO2   : Cty nước Cần Thơ 2
- CB     : Cty nước Cao Bằng
- DNA    : Cty nước Đà Nẵng
- DT     : Cty nước Đồng Tháp
- HCMGD  : Cty nước Gia Định
- HNA    : Cty nước Hà Nam
- HP     : Cty nước Hải Phòng
- HUE    : Cty nước Huế
- DNILK  : Cty nước Long Khánh – Đồng Nai
- HCMPHT : Cty nước Phú Hòa Tân – TP.HCM
- BRVTPM : Cty nước Phú Mỹ - BRVT
- HP2    : Cty nước số 2 Hải Phòng
- SL     : Cty nước Sơn La
- HCMTH  : Cty nước Tân Hòa – TP.HCM
- HCMTD  : Cty nước Thủ Đức – TP.HCM
- VIWACO : Cty CP Viwaco
- DNIDVXD: Cty DVXD cấp nước Đồng Nai
- HN3    : Cty nước số 3 Hà Nội
===============================
* ERROR_CODE
- 00: Thành công
- 01: Thất bại
- 02: Tham số không hợp lệ
- 03: Checksum không hợp lệ
- 04: IP đối tác bị khóa hoặc chưa được khai báo
- 05: Đối tác bị khóa hoặc chưa được khai báo
- 06: Tham số chưa chính xác
- 07: Dịch vụ chưa được khai báo
- 08: Sản phẩm chưa được khai báo
- 09: Thuộc tính/Mệnh giá sản phẩm chưa được khai báo
- 20: Kênh chưa được khai báo
- 21: Dịch vụ Nhà cung cấp không hợp lệ
- 22: Mã giao dịch đối tác không được trùng nhau
- 23: Không tìm thấy yêu cầu dịch vụ
- 24: Mã yêu cầu thanh toán không được trùng nhau
- 25: Số dư không đủ để thanh toán
- 26: Mã hóa đơn không chính xác hoặc chưa đến kỳ thanh toán
- 27: Hết thời gian thanh toán
- 28: Mã thanh toán không tồn tại
- 29: Mã thanh toán và số tiền không hợp lệ
- 30: Vé bị block sau khi thanh toán
- 31: Đã thanh toán bởi chi nhánh khác
- 32: Hạn mức không đủ để thanh toán
- 98: Timeout
- 99: Lỗi chưa xác định
*/
