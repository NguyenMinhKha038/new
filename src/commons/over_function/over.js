import Base64Image from 'base64-img';
import { errorCode as Errors, logger as Logger, BaseError } from '../utils';

function getJoiError(error) {
  let errors = new BaseError({
    statusCode: 400,
    error: Errors.validate,
    errors: {}
  });
  // assign error details
  let details = error.details;
  let index = '';
  let message = {};
  for (let i = 0; i < details.length; i++) {
    if (details[i].path.length == 3) {
      if (index != details[i].path[0]) {
        index = details[i].path[0]; // position of field input errors
        errors.errors[index] = {}; // init a error with above field
      }
      errors.errors[index][details[i].path[1]] = {
        [details[i].path[2]]: Errors[details[i].type]
      };
      message[index] = { [details[i].path[2]]: details[i].message };
    } else if (details[i].path.length == 2) {
      errors.errors[details[i].path[0]] = {
        [details[i].path[1]]: Errors[details[i].type]
      };
      message[details[i].path[0]] = {
        [details[i].path[1]]: details[i].message
      };
    } else {
      errors.errors[details[i].context.key] = Errors[details[i].type];
      message[details[i].context.key] = details[i].message;
    }
  }
  errors.addMeta({ message });
  Logger.error(error);
  return errors;
}

function isPermissionAvailable(array, code) {
  for (let i = 0; i < array.length; i++) {
    if (array[i].code == code) return true;
  }
  return false;
}

function returnBaseError(statusCode, error, errorsCode, errorsMess, errorsKey = '') {
  return {
    statusCode: statusCode,
    error: error,
    errors: {
      code: errorsCode,
      message: errorsMess,
      key: errorsKey
    }
  };
}

function returnOneFromAll(array, value, key) {
  if (array.length == 0) return false;
  for (let i = 0; i < array.length; i++) {
    let val = array[i][key].toString();
    if (val == value) {
      return array[i];
    }
  }
}

function isUniqueInArray(array, value, index) {
  if (array.length == 0)
    return {
      status: false,
      position: -1
    };
  for (let i = 0; i < array.length; i++) {
    if (i == index) continue; // if i == position of value in array
    if (array[i] == value) {
      return {
        status: false,
        position: i
      };
    }
  }
  return {
    status: true,
    position: -1
  };
}

function isExistedInArray(array, value, key = false) {
  if (array.length == 0)
    return {
      status: false,
      position: -1
    };
  if (key) {
    for (let i = 0; i < array.length; i++) {
      if (array[i][key] == value) {
        return {
          status: true,
          position: i
        };
      }
    }
  } else {
    for (let i = 0; i < array.length; i++) {
      if (array[i] == value) {
        return {
          status: true,
          position: i
        };
      }
    }
  }

  return {
    status: false,
    position: -2
  };
}

function isExistedPath(url, path) {
  let positionCut = url.search('api') + 4;
  url = url.slice(positionCut, url.length);

  let end = url.search('/');
  let pathh = url.slice(0, end);

  if (path == pathh) return true;
  return false;
}

//follow
function isFollowed(arrayFollowers, followerId) {
  if (arrayFollowers.length == 0) return false;

  for (let i = 0; i < arrayFollowers.length; i++) {
    if (arrayFollowers[i].follower_id._id == followerId) {
      return {
        isFollowed: true,
        id: arrayFollowers[i]._id // return id of follow core
      };
    }
  }

  return false;
}

function returnListLessPeriodTime(list, currentTime, period) {
  if (list.length == 0) {
    return [];
  } else {
    let result = [];
    for (let i = 0; i < list.length; i++) {
      let deterTime = new Date(list[i].createdAt).getTime();
      if (currentTime - deterTime <= period) {
        result.push(list[i]);
      }
    }
    return result;
  }
}

function returnPathImageFromRequest(input, dir, name) {
  let regexBase64 = /data:image\/[a-z]+;base64,/;
  let regexPathInput = /static\/private\/images\/[1-9]+.[a-f0-9]+./;
  if (!input.match(regexBase64) && input.match(regexPathInput)) {
    return input;
  } else if (input.match(regexBase64)) {
    let path = Base64Image.imgSync(input, dir, name);

    return 'static/' + path.substring(path.indexOf('private/images'), path.length);
  } else {
    return null;
  }
}

function returnNextNumberOfBase36(string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = string.length - 1; i >= 0; i--) {
    let index = chars.indexOf(string[i]);
    let postfixed = '';
    if (i < string.length - 1) {
      postfixed = string.slice(i - string.length);
    }
    if (index == chars.length - 1) {
      string = string.slice(0, i) + chars.charAt(0) + postfixed;
    } else {
      return (string = string.slice(0, i) + chars.charAt(index + 1) + postfixed);
    }
  }
}

// online times

function returnAllRecordsOfTimeType(array, date, type) {
  if (array.length == 0) {
    return [];
  }
  let result = [];
  if (type == 'day') {
    let time = date.getTime();
    let day = date.getDay();
    for (let i = 0; i < array.length; i++) {
      let recordDay = new Date(array[i].createdAt).getDay();
      let recordTime = new Date(array[i].createdAt).getTime();

      if (recordDay == day && time - recordTime <= 86400 * 1000) {
        result.push(array[i]);
      }
    }
  } else if (type == 'week') {
    let time = date.getTime();
    let week = getWeek(date);
    for (let i = 0; i < array.length; i++) {
      let recordWeek = getWeek(array[i].createdAt);
      let recordTime = array[i].createdAt.getTime();

      if (recordWeek == week && time - recordTime <= 86400 * 7 * 1000) {
        result.push(array[i]);
      }
    }
  } else if (type == 'month') {
    let time = date.getTime();
    let month = date.getMonth();
    let days = 30;
    let fullMonth = [0, 2, 4, 6, 7, 9, 11];
    if (month == 1) days = 28;
    if (fullMonth.indexOf(month) >= 0) days = 31;
    for (let i = 0; i < array.length; i++) {
      let recordMonth = array[i].getMonth();
      let recordTime = array[i].createdAt.getTime();

      if (recordMonth == month && time - recordTime <= 86400 * days * 1000) {
        result.push(array[i]);
      }
    }
  }
  return result;
}

function returnRecordsAllDayOfWeek(array) {
  if (array.length == 0) return {};
  // let result = {};
  var sun = [],
    mon = [],
    tue = [],
    wed = [],
    thu = [],
    fri = [],
    sat = [];
  for (let i = 0; i < array.length; i++) {
    switch (array[i].createdAt.getDay()) {
      case 0: {
        sun.push(array[i]);
        break;
      }
      case 1: {
        mon.push(array[i]);
        break;
      }
      case 2: {
        tue.push(array[i]);
        break;
      }
      case 3: {
        wed.push(array[i]);
        break;
      }
      case 4: {
        thu.push(array[i]);
        break;
      }
      case 5: {
        fri.push(array[i]);
        break;
      }
      case 6: {
        sat.push(array[i]);
        break;
      }
    }
  }
  return { sun, mon, tue, wed, thu, fri, sat };
}

function statisticOfWeek(Objects) {
  if (!Objects) return {};
  let max = { day: 'none', time: 0 };
  let min = { day: 'none', time: 1000000 };
  let totalTimes = 0;
  let result = {
    detail: { sun: {}, mon: {}, tue: {}, wed: {}, thu: {}, fri: {}, sat: {} }
  };
  for (let record in Objects) {
    let records = Objects[record];
    if (records.length == 0) continue;
    let totalTime = 0;
    for (let i = 0; i < records.length; i++) {
      totalTime += records[i].period_time;
    }
    totalTimes += totalTime;
    result.detail[record].total_time = totalTime / 3600;
    result.detail[record].average = totalTime / (3600 * 24);
    if (max.time < totalTime) {
      max.time = totalTime;
      max.day = record;
    }
    if (min.time > totalTime) {
      min.time = totalTime;
      min.day = record;
    }
  }
  result.max = max;
  result.min = min;
  result.totalTimes = totalTimes / 3600;
  result.averagePerDay = totalTimes / (7 * 3600);
  return result;
}

function returnTotalTime(array) {
  if (array.length == 0) {
    return 0;
  }
  let totalTime = 0;
  for (let i = 0; i < array.length; i++) {
    totalTime += array[i].period_time;
  }
  return totalTime;
}

function getWeek(time) {
  let year = time.getFullYear();
  let timeStartYear = new Date(year.toString()).getTime();
  let week = (time - timeStartYear) / (86400 * 7 * 1000);
  return Math.ceil(week);
}

//online-time between period
function returnRecordsOfEachDayBetweenPeriod(array, start, end) {
  if (array.length == 0) return [];
  let result = {};
  let days = (end - start) / 86400000;

  let numberDaysOfStart = start / 86400000;
  let allowDays = [];
  for (let i = 0; i < days; i++) {
    allowDays.push(numberDaysOfStart + i);
    result[new Date((numberDaysOfStart + i) * 86400000).getDate()] = [];
  }

  for (let i = 0; i < array.length; i++) {
    let numberDays = Math.floor(array[i].createdAt.getTime() / 86400000);
    let index = allowDays.indexOf(numberDays);
    if (index >= 0) {
      result[array[i].createdAt.getDate()].push(array[i]);
    }
  }
  return result;
}

//user controller
function isRightDate(dateString) {
  // Parse the date parts to integers
  var parts = dateString.split('-');
  var day = parseInt(parts[2], 10);
  var month = parseInt(parts[1], 10);
  var year = parseInt(parts[0], 10);

  // Check the ranges of month and year
  if (year < 1000 || year > 3000 || month == 0 || month > 12 || day <= 0) return false;

  // Adjust for leap years
  if ((year % 400 == 0 && year % 4 == 0) || (year % 100 != 0 && year % 4 == 0)) {
    if (month == 2 && day > 29) return false;
    else return true;
  }

  let fullMonth = [1, 3, 5, 7, 8, 10, 12];
  if (fullMonth.indexOf(month) >= 0 && day > 31) {
    return false;
  } else if (month == 2 && day > 28) return false;
  else if (fullMonth.indexOf(month) < 0 && day > 30) return false;

  return true;
}

function randomText(num_of_symbol) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < num_of_symbol; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

export default {
  // online-time
  randomText,
  returnAllRecordsOfTimeType,
  getWeek,
  returnTotalTime,
  returnListLessPeriodTime,
  returnRecordsAllDayOfWeek,
  statisticOfWeek,
  returnRecordsOfEachDayBetweenPeriod,
  // basic
  getJoiError,
  returnOneFromAll,
  returnBaseError,

  returnPathImageFromRequest,
  returnNextNumberOfBase36,

  isPermissionAvailable,
  isUniqueInArray,
  isExistedInArray,
  isExistedPath,
  isFollowed,

  isRightDate
};
