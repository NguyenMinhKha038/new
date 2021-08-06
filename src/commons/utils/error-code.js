export default {
  validate: 4000,
  'any.required': 4000100,
  'any.allowOnly': 4000101,
  'any.unknown': 4000102,
  'any.invalid': 4000103,
  'any.empty': 4000104,
  'any.notAvailable': 4000105,
  'boolean.base': 4000200,
  'number.base': 4000300,
  'number.min': 4000301,
  'number.max': 4000302,
  'number.less': 4000303,
  'number.greater': 4000304,
  'string.base': 4000400,
  'string.min': 4000401,
  'string.max': 4000402,
  'string.length': 4000403,
  'string.regex': 4000404,
  'string.regex.name': 4000405,
  'string.email': 4000406,
  'string.regex.base': 4000407,
  'object.allowUnknown': 4000500,
  'array.duplicate': 4000600,
  'array.unique': 4000601,
  'array.length': 4000602,
  'date.base': 4000700,
  'date.min': 4000701,
  'date.exceed': 4000702,
  'password.used': 4000800,
  'number.startAtZero': 4000801,
  'date.less': 4000802,

  authorization: 5000,
  'permission.same': 5000100,
  'permission.less': 5000101,
  'permission.notAllow': 5000102,
  'permission.notAvailable': 5000103,
  'permission.notFound': 5000104,
  'autho.notMatch': 5000200,
  'autho.existed': 5000201,
  'autho.notexisted': 5000202,
  'status.disable': 5000300,
  'company.notAvailable': 5000400,
  'auth.yourself': 5000500,
  'auth.equalZero': 5000501,
  'auth.notActive': 5000600,
  'auth.notApproved': 5000601,
  'company.canNotEnter': 5000602,
  'company.wrongpin': 5000603,
  'auth.unAuthorized': 5000604,
  'token.expired': 5000605,

  server: 6000,
  'server.adminNotInit': 6000100,
  'server.userEmpty': 6000200,
  'server.canNodFind': 6000300,
  'server.configNotExist': 6000301,
  'server.invalidConfig': 6000302,

  'server.internalError': 6000600,
  'server.thirdPartyError': 6000601,

  client: 7000,
  'client.wrongInput': 7000100,

  //video
  'client.youtubeIdWrong': 7000200,
  'client.videoAlreadyExist': 7000201,
  'client.videoNotExist': 7000202,
  'client.favoriteVideoIdNotExist': 7000203,
  'client.favoriteVideoExist': 7000204,

  //category
  'client.categoryNotExist': 7000300,
  'client.categoryDuplicate': 7000301,
  'client.favoriteCategoryIdNotExist': 7000302,
  'client.favoriteCategoryExist': 7000303,
  'client.categoryParentNotMatch': 7000304,
  'client.categoryTypeMustGreaterThanOne': 7000305,
  'client.categoryMustBeLowestInCategoryTree': 700306,

  //comment
  'client.commentNotExist': 7000400,
  'client.replyNotExist': 7000401,
  'client.commentAndVideoNotMatch': 7000402,
  'client.commentAndProductNotMatch': 7000403,
  'client.commentCompanyNotMatch': 7000404,
  'client.mustBuyProductFirst': 7000405,
  'client.commentExceedLimit': 7000406,
  'client.commentIsDeleted': 7000407,

  //upload
  'client.invalidFileType': 7000500,
  'client.fileMissing': 7000501,

  //transaction
  'client.pointNotEnough': 7000600,
  'client.rewardIsNotActive': 7000601,
  'client.rewardOutOfStock': 7000602,
  'client.rewardNotExist': 7000603,
  'client.rewardRedeemReachLimit': 7000604,
  'client.transactionNotExist': 7000606,
  'client.transactionHasBeenApproved': 7000607,
  'client.rewardHasBeenExpired': 7000608,
  'client.rewardHasNotBeenStarted': 7000609,
  'client.MoneyNotEnough': 7000610,
  'client.RefundFundNotEnough': 7000611,
  'client.overLimitPerDay': 7000612,
  'client.minMoney': 7000613,
  'client.transactionExisted': 7000614,
  'client.typeNotAllow': 7000615,
  'client.configNotExist': 7000700,
  'client.configDuplicate': 7000701,

  //ref_code
  'client.refCodeNotmatch': 7000800,
  'client.refOverTime': 7000801,
  'client.refYourSelf': 7000802,
  // image
  'client.wrongImage': 7000900,

  //company
  'client.companyNotExist': 7000100,
  'client.companyLimitExceeded': 7000101,
  'client.companyNotApproved': 7000102,
  'client.companyIsExist': 7000103,

  //banner
  'client.bannerNotExist': 7001100,
  'client.bannerHasBeenApproved': 7001101,
  'client.bannerCanNotChangeStatus': 7001102,
  'client.bannerTimeNotValid': 7001103,
  'client.bannerIsExist': 7001104,

  //group product
  'client.groupProductNotExist': 7001200,
  'client.groupProductDuplicate': 7001201,

  //product
  'client.productNotExist': 7001300,
  'client.productIsExistedInCart': 7001301,
  'client.productNotExistInStore': 7001302,
  'client.stockCannotBeNegative': 7001303,
  'client.validDateIsNotValid': 7001304,
  'client.cannotChangeProductOnSale': 7001305,
  'client.invalidRequest': 7001306,
  'client.missingPackagingAttributes': 7001306,
  'client.productIsExistedInStore': 7001307,
  'client.productNotExistInCart': 7001308,
  'client.stockNotEnough': 7001309,
  'client.productTemplateIsNotAllow': 7001310,
  'client.missingRequiredAttributes': 701311,
  'client.invalidTierIndex': 701312,
  'client.invalidModelListLength': 701313,
  'client.productExisted': 701314,
  'client.invalidProductModel': 7001315,
  'client.missingNecessaryField': 701316,
  'client.SKUalreadyExisted': 701317,
  'client.notValid': 7001318,

  //order + cart
  'client.orderNotExist': 7001400,
  'client.orderUnpaidExist': 7001401,
  'client.cartNotCheckouted': 7001402,
  'client.cartIsEmpty': 7001403,
  'client.cartIsPaid': 7001404,
  'client.cartIsCanceled': 7001405,
  'client.cartIsCompleted': 7001406,
  'client.cartIsNotComfirmed': 7001407,
  'client.cartPaymentMethod': 7001408,
  'client.cartNotExist': 7001409,
  'client.orderStatused': 7001410,
  'client.addressNotFound': 7001411,
  'client.paymentCodeNotValid': 7001412,
  'client.orderIsPaid': 7001413,
  'client.orderCanNotCancelByLimit': 7001414,
  'client.orderCanNotCancelByStatus': 7001415,
  'client.outOfStock': 7001416,
  'client.orderIsOffline': 7001417,
  'client.orderMustBeOffline': 7001418,
  'client.orderMustBeDelivered': 7001419,
  'client.orderCanNotCanceled': 7001420,
  'client.orderMustBeReady': 7001421,

  'client.cannotBuyThisTime': 7001421,
  'client.orderIsReceivedAtStore': 7001422,
  'client.orderCanOnlyReceivedAtStore': 7001423,
  'client.orderIsConfirmed': 7001424,
  'client.orderCanNotChange': 7001425,
  'client.orderIsNotConfirmed': 7001426,
  'client.orderIsReceived': 7001427,
  'client.orderStatusIsInvalid': 7001428,
  'client.orderMustBeConfirmed': 7001429,
  'client.orderIsInvalid': 7001432,
  'client.cannotOrderWholesale': 7001433,
  'client.hasNoBoxPrice': 7001434,

  //store
  'client.storeNotExist': 7001500,
  'client.storeIsExist': 7001501,
  'client.storeLimitExceeded': 7001502,

  //promotion promotion-code
  'client.codeIsMaxUsed': 7001600,
  'client.startDateLessThanCurrentDate': 7001601,
  'client.startDateGreatThanExpireDate': 7001602,
  'client.startDateLessThanCurrentDateOrGreaterThanExpireDate': 7001603,
  'client.productAlreadyExistInPromotion': 7001604,
  'client.promotion.productNotFound': 7001605,
  'client.promotion.notFound': 7001606,
  'client.promotion.cannotEdit': 7001607,
  'client.promotion.productIsNotExistedInStore': 7001608,
  'client.amountGreatThanMaximum': 7001609,
  'client.valueAndTypeNoneCorresponding': 7001610,
  'client.unsuitableProductsOfCompany': 7001611,
  'client.cannotAccess': 7001612,
  'client.promotionRegistration.existed': 7001613,
  'client.startDateGreaterThanExpireDate': 7001614,
  'client.registrationPromotionNotExists': 7001615,
  'client.registrationDateLessThanCurrentDate': 7001616,
  'client.registrationDateGreaterThanStartDate': 7001617,
  'client.registrationExisted': 7001618,
  'client.amountGreaterThanMaximum': 7001619,
  'client.promotion.hadBeenDisabled': 7001620,
  'client.promotion.notActive': 7001621,
  'client.promotion.productAlreadyExisted': 7001622,
  'client.promotionExisted': 7001623,
  'client.registrationNotFound': 7001624,
  //follower

  //user
  'client.userNotFound': 7001700,
  'client.wrongPIN': 7001701,
  'client.userWasVerified': 7001702,
  'client.timeNotExpired': 7001703,
  'client.userNotActive': 7001704,
  'client.passwordDuplicate': 7001705,
  'client.userNotApproveKyc': 7001706,
  'client.existed': 7001707,
  'client.PinDuplicate': 7001708,

  //bill
  'client.billIsEmpty': 7001800,
  'client.billNumberInvalid': 7001801,
  'client.billPublisherNotActive': 7001802,
  'client.topupParamNotValid': 7001803,

  //token time out
  'client.tokenTimeOut': 7002000,

  //type company
  'client.typeCompanyNotFound': 7002100,
  'client.typeCompanyExist': 7002101,
  'client.categoryExist': 7002102,
  'client.company.notApproved': 7002103,
  // 'client.companyBankNotFound': 7002200,

  //Logistics
  'client.logisticsTokenIsNotValid': 7002300,
  'client.AddressIsNotValid': 7002301,
  'client.logisticsIsUnavailable': 7002302,
  'client.productIsNotTransportable': 7002303,
  'client.emailOrPhoneNumberIsUnavailable': 7002304,
  'client.emailOrPasswordIsWrong': 7002305,
  'client.companyIsOfflineSales': 7002306,
  'client.companyDiscountTransportNumber': 7002307,
  'client.logisticsIsNotValid': 7002308,
  'client.companyDiscountTransportMin': 7002309,

  //global
  'client.global.notFound': 7002400,
  'client.global.existed': 7002401,
  'client.paymentMethodNotValid': 7002402,
  //lucky_shopping
  'client.luckyShoppingNotFound': 7002500,
  'client.luckyShoppingIsHandled': 7002501,
  'client.luckyShoppingWinnerExceed': 7002502,

  // user bank
  'client.user-bank.notFound': 7002500,

  //company bank
  'client.company-bank.notFound': 7002600,
  // admin bank
  'client.admin-bank.notFound': 7002700,

  //admin
  'client.adminNotExists': 7002701,

  // top up
  'client.amountIsInactive': 7002800,

  //vnp
  'client.vnpNotEqualValue': 7003000,

  //deposit-withdraw
  'client.valueNotAvailable': 7004000,

  //verify
  'client.outOfLimit': 7005000,
  //staff
  'client.staff.repeatStatus': 7006000,
  'client.staff.yourself': 7006001,
  'client.staff.existed': 7006002,
  'client.staff.notExisted': 7006003,

  //promotion code
  'client.promotion-code.notFound': 7007100,
  'client.promotion-code.outOfStock': 7007101,

  //report
  'client.exceedMaxReportTimesPerDay': 7007200,

  //store_configs
  'client.storeConfigNotExist': 7007500,
  'client.storeConfigIsExist': 7007501,
  'client.storeConfigLimitExceeded': 7007502,

  // stock history
  'client.stockHistoryNotFound': 7008000,

  // warehouse
  'client.warehouseNotFound': 7008100,
  'client.warehouseExisted': 7008101,

  // provider
  'client.providerNotFound': 7009000,
  'client.providerExisted': 7009001,

  // goods batch
  'client.goodsBatchNotFound': 7009100,
  'client.goodsBatchStockCanNotBeNegative': 7009101,
  'client.goodsBatchStockNotEnough': 7009102,
  'client.goodsBatchStockIsInvalid': 7009103,

  // mall-storing
  'client.mallStoringNotFound': 7009200,

  // warehouse-storing
  'client.warehouseStoringNotFound': 7009300,

  //mall
  'client.mallExists': 7009400,
  'client.notMallManager': 7009401,
  'client.mallNotExists': 7009402,
  'client.phoneNumberIsUsed': 7009403,
  'client.isOtherMallManager': 7009404,
  'client.isDisabledByAdmin': 7009405,
  'client.isOtherMallStaff': 7009406,

  // mall staff
  'client.existedMallStaff': 7009500,
  'client.staffNotExists': 7009501,
  'client.invalidWorkShift': 7009502,

  // mall staff check in
  'client.checkInNotExists': 7009600,
  'client.notActive': 7009601,
  'client.checkInExisted': 7009602,
  'client.outOfDate': 7009603,
  //work schedule
  'client.scheduleExisted': 7009700,
  'client.scheduleNotExists': 7009701,
  'client.scheduleCannotAccess': 7009702,
  'client.tooLate': 7009703,
  'client.inValidSchedule': 7009704,
  // mall activity
  'client.mallActivityNotExists': 7009800,
  // company schedule
  'client.staffNotActive': 7009900,
  'client.noScheduleSettingExists': 7009901,

  //menu
  'client.menuIsEmpty': 7010000,
  'client.menuNotFound': 7010001,
  'client.menuExisted': 7010002,

  // selling option
  'client.sellingOptionNotFound': 7011000,
  'client.sellingOptionExisted': 7011001,
  'client.sellingSelectionNotFound': 7011002,
  'client.sellingSelectionExisted': 7011003,
  'client.sellingSelectionOptionNotFound': 7011004,
  'client.sellingoptionItemNotFound': 7011004,

  // tag
  'client.tagNotFound': 7012000,
  'client.tagExisted': 7012001,

  // group
  'client.groupNotFound': 7013000,
  'client.groupExisted': 7013001,

  // product attribute
  'client.productAttributeNotFound': 7014000,
  'client.productAttributeNotAllow': 7014001,
  // product template
  'client.productTemplateNotFound': 7015000,
  'client.cannotUpdateActiveProductTemplate': 7015001,
  'client.productTemplateNotInPending': 7015002,

  // accompanied product
  'client.accompaniedProductNotFound': 7016000,
  'client.accompaniedProductQuantityNotEnough': 7016001,

  //stock-checking
  'client.stockCheckingNotFound': 7017000,
  'client.statusNotAllowed': 7017001,
  'client.stockCheckingMustBeHandling': 7017002,

  // stock-checking-item
  'client.stockCheckingItemNotFound': 7018000,

  //product-storing
  'client.productStoringNotFound': 7019000,

  action: 9000,
  'follow.haveDone': 9000100,
  'follow.notYet': 9000101,
  'follow.self': 9000102,
  'refCode.haveDone': 9000200,
  'promotionCode.outOfQuantity': 9000300
};
