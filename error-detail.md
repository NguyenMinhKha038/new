```
[
  {
    "type": "validate",
    "code": 4000,
    "messageVi": "lỗi xác thực",
    "messageEn": "validation error",
    "errors": [
      {
        "type": "any.required",
        "code": 4000100,
        "messageVi": "là bắt buộc",
        "messageEn": "is required"
      },
      {
        "type": "any.allowOnly",
        "code": 4000101,
        "messageVi": "phải là một trong các giá trị hợp lệ",
        "messageEn": "must be one of valids"
      },
      {
        "type": "any.unknown",
        "code": 4000102,
        "messageVi": "là không được phép",
        "messageEn": "is not allowed"
      },
      {
        "type": "any.invalid",
        "code": 4000103,
        "messageVi": "là bắt buộc",
        "messageEn": "is required"
      },
      {
        "type": "any.empty",
        "code": 4000104,
        "messageVi": "không được để trống",
        "messageEn": "is not allowed to be empty"
      },
      {
        "type": "any.notAvailable",
        "code": 4000105,
        "messageVi": "không tồn tại",
        "messageEn": "is not available"
      },
      {
        "type": "boolean.base",
        "code": 4000200,
        "messageVi": "phải là kiểu bool",
        "messageEn": "must be a boolean"
      },
      {
        "type": "number.base",
        "code": 4000300,
        "messageVi": "phải là một số",
        "messageEn": "'must be a number"
      },
      {
        "type": "number.min",
        "code": 4000301,
        "messageVi": "phải lớn hơn hoặc bằng giới hạn",
        "messageEn": "must be larger than or equal to limit"
      },
      {
        "type": "number.max",
        "code": 4000302,
        "messageVi": "phải nhỏ hơn hoặc bằng giới hạn",
        "messageEn": "must be less than or equal to limit"
      },
      {
        "type": "number.less",
        "code": 4000303,
        "messageVi": "phải nhỏ hơn giới hạn",
        "messageEn": "'must be less than limit"
      },
      {
        "type": "number.greater",
        "code": 4000304,
        "messageVi": "phải lớn hơn giới hạn",
        "messageEn": "must be greater than limit"
      },
      {
        "type": "string.base",
        "code": 4000400,
        "messageVi": "phải là một chuỗi",
        "messageEn": "must be a string"
      },
      {
        "type": "string.min",
        "code": 4000401,
        "messageVi": "độ dài phải ít nhất giới hạn kí tự",
        "messageEn": "length must be at least limit characters long"
      },
      {
        "type": "string.max",
        "code": 4000402,
        "messageVi": "độ dài phải nhỏ hơn hoặc bằng giới hạn kí tự",
        "messageEn": "length must be less than or equal to limit characters long"
      },
      {
        "type": "string.length",
        "code": 4000403,
        "messageVi": "độ dài không được vượt quá giới hạn kí tự",
        "messageEn": "length must be limit characters long"
      },
      {
        "type": "string.regex",
        "code": 4000404,
        "messageVi": "giá trị không phù hợp mẫu",
        "messageEn": "with value fails to match the pattern"
      },
      {
        "type": "string.regex.name",
        "code": 4000405,
        "messageVi": "giá trị không phù hợp mẫu",
        "messageEn": "with value fails to match the pattern"
      },
      {
        "type": "string.email",
        "code": 4000406,
        "messageVi": "phải là email hợp lệ",
        "messageEn": "must be a valid email"
      },
      {
        "type": "string.regex.base",
        "code": 4000407,
        "messageVi": "giá trị không phù hợp theo danh sách được phép",
        "messageEn": "with value fails to match the allowed list"
      },
      {
        "type": "object.allowUnknown",
        "code": 4000500,
        "messageVi": "không cho phép trường unknown",
        "messageEn": "unknown field is not allowed"
      },
      {
        "type": "array.duplicate",
        "code": 4000600,
        "messageVi": "phần tử mảng bị trùng",
        "messageEn": "content in array is duplicate"
      },
      {
        "type": "array.duplicate",
        "code": 4000601,
        "messageVi": "phần tử mảng là duy nhất",
        "messageEn": "content in array is unique"
      },
      {
        "type": "password.used",
        "code": 4000800,
        "messageVi": "mật khẩu đã sử dụng",
        "messageEn": "password is used"
      }
    ]
  },
  {
    "type": "authorization",
    "code": 5000,
    "messageVi": "lỗi xác thực quyền đối tượng",
    "messageEn": "authorization errors",
    "errors": [
      {
        "type": "permission.same",
        "code": 5000100,
        "messageVi": "đồng cấp!",
        "messageEn": "same permission!"
      },
      {
        "type": "permission.less",
        "code": 5000101,
        "messageVi": "cấp của bạn thấp hơn!",
        "messageEn": "your permission less than!"
      },
      {
        "type": "permission.notAllow",
        "code": 5000102,
        "messageVi": "bạn không  được cấp quyền!",
        "messageEn": "you are not alowed!"
      },
      {
        "type": "permission.notAvailable",
        "code": 5000103,
        "messageVi": "mã quyền không tồn tại",
        "messageEn": "permission code is not available"
      },
      {
        "type": "autho.notMatch",
        "code": 5000200,
        "messageVi": "không khớp",
        "messageEn": "does not match!"
      },
      {
        "type": "autho.existed",
        "code": 5000201,
        "messageVi": "đã tồn tại",
        "messageEn": "have existed"
      },
      {
        "type": "status.disable",
        "code": 5000300,
        "messageVi": "tài khoản bị khóa",
        "messageEn": "account is blocked"
      }
    ]
  },
  {
    "type": "server",
    "code": 6000,
    "messageVi": "lỗi server",
    "messageEn": "server errors",
    "errors": [
      {
        "type": "server.adminNotInit",
        "code": 6000100,
        "messageVi": "Admin chưa được khởi tạo",
        "messageEn": "Admin is not inited"
      },
      {
        "type": "server.userEmpty",
        "code": 6000200,
        "messageVi": "danh sách user rỗng",
        "messageEn": "database users is empty"
      },
      {
        "type": "server.canNotFind",
        "code": 6000300,
        "messageVi": "không tìm thấy",
        "messageEn": "can not find"
      }
    ]
  },
  {
    "type": "client",
    "code": 7000,
    "messageVi": "lỗi client",
    "messageEn": "client errors",
    "errors": [
      {
        "type": "client.wrongInput",
        "code": 7000100,
        "messageVi": "giá trị nhập sai, không thể tìm thấy đối tượng yêu cầu",
        "messageEn": "wrong input, can not find request object"
      },
      {
        "type": "client.youtubeIdWrong",
        "code": 7000200,
        "messageVi": "Video không tồn tại trên youtube",
        "messageEn": "The video does not exist on youtube"
      },
      {
        "type": "client.videoAlreadyExist",
        "code": 7000201,
        "messageVi": "Video đã tồn tại",
        "messageEn": "Video already exists"
      },
      {
        "type": "client.videoNotExist",
        "code": 7000201,
        "messageVi": "Video không tồn tại",
        "messageEn": "The video does not exist"
      },
      {
        "type": "client.categoryNotExist",
        "code": 7000300,
        "messageVi": "thể loại này không tồn tại",
        "messageEn": "category does not exist"
      },
      {
        "type": "client.favoriteVideoIdNotExist",
        "code": 7000203,
        "messageVi": "id ưa thích video này không tồn tại",
        "messageEn": "favorite_video_id does not exist"
      },
      {
        "type": "client.favoriteVideoExist",
        "code": 7000204,
        "messageVi": "đã thêm video này vào ưa thích rồi",
        "messageEn": "You have added this video to your favorites"
      },
      {
        "type": "client.categoryDuplicate",
        "code": 7000301,
        "messageVi": "thể loại này đã tồn tại",
        "messageEn": "category already exist"
      },
      {
        "type": "client.favoriteCategoryIdNotExist",
        "code": 7000302,
        "messageVi": "id của thể loại ưa thích này đã tồn tại",
        "messageEn": "The id of this favorite category already exists"
      },
      {
        "type": "client.favoriteCategoryExist",
        "code": 7000302,
        "messageVi": "bạn đã thêm thể loại này vào ưa thích rồi",
        "messageEn": "You have added this category to your favorites"
      },
      {
        "type": "client.commentNotExist",
        "code": 7000400,
        "messageVi": "comment này không tồn tại",
        "messageEn": "This comment does not exist"
      },
      {
        "type": "client.replyNotExist",
        "code": 7000401,
        "messageVi": "reply này không tồn tại",
        "messageEn": "This reply does not exist"
      },
      {
        "type": "client.invalidFileType",
        "code": 7000500,
        "messageVi": "định dạng tệp không hợp lệ",
        "messageEn": "invalid file type"
      },
      {
        "type": "client.fileMissing",
        "code": 7000501,
        "messageVi": "thiếu tệp",
        "messageEn": "file is missing"
      },
      {
        "type": "client.pointNotEnough",
        "code": 7000600,
        "messageVi": "bạn không đủ điểm để đổi quà",
        "messageEn": "your point is not enough to exchange"
      },
      {
        "type": "client.rewardIsNotActive",
        "code": 7000601,
        "messageVi": "quà không còn được quy đổi",
        "messageEn": "this reward is no longer used"
      },
      {
        "type": "client.rewardOutOfStock",
        "code": 7000602,
        "messageVi": "quà đã được quy đổi hết",
        "messageEn": "this reward is out of stock"
      },
      {
        "type": "client.rewardNotExist",
        "code": 7000603,
        "messageVi": "quà không tồn tại",
        "messageEn": "this reward is not exist"
      },
      {
        "type": "client.rewardRedeemReachLimit",
        "code": 7000604,
        "messageVi": "bạn đã đạt đến giới hạn quy đổi quà này",
        "messageEn": "You have reached the limit to redeem this gift"
      },
      {
        "type": "client.transactionNotExist",
        "code": 7000605,
        "messageVi": "giao dịch này không tồn tại",
        "messageEn": "This transaction does not exist"
      },
      {
        "type": "client.refCodeNotMatch",
        "code": 7000800,
        "messageVi": "ref_code không khớp",
        "messageEn": "this ref_code does not match"
      },
      {
        "type": "client.refOverTime",
        "code": 7000801,
        "messageVi": "quá giới hạn nhập ref_code",
        "messageEn": "over time to enter the ref_code"
      },
      {
        "type": "client.refYourSelf",
        "code": 7000802,
        "messageVi": "đây là ref_code của bạn :), đùa :v ?",
        "messageEn": "this is your ref_code :), kidding :v ?"
      },
      {
        "type": "client.wrongImage",
        "code": 7000900,
        "messageVi": "sai đường dẫn hoặc không phải ảnh",
        "messageEn": "wrong path or not a image"
      }
    ]
  },
  {
    "type": "action",
    "code": 8000,
    "messageVi": "lỗi hành động",
    "messageEn": "action errors",
    "errors": [
      {
        "type": "follow.haveDone",
        "code": 8000100,
        "messageVi": "bạn đã theo dõi người này rồi",
        "messageEn": "you have followed this man"
      },
      {
        "type": "follow.notYet",
        "code": 8000101,
        "messageVi": "bạn chưa theo dõi người này",
        "messageEn": "you have not followed this man yet"
      },
      {
        "type": "follow.self",
        "code": 8000102,
        "messageVi": "bạn không được theo dõi chính mình",
        "messageEn": "you have not been allowed yourself"
      },
      {
        "type": "refCode.haveDone",
        "code": 8000200,
        "messageVi": "bạn đã nhập mã giới thiệu",
        "messageEn": "you have entered ref_code"
      },
      {
        "type": "promotionCode.outOfQuantity",
        "code": 8000300,
        "messageVi": "mã khuyến mãi đã phát hết",
        "messageEn": "promotion codes have been out of quantity"
      }
    ]
  }
]
```