/**
 *
 *
 * @param {Date} [aDate=new Date()]
 * @param {Date} [anotherDate='']
 * @returns {Date | Date[]} date or array date with only date month year
 */
const getDate = (aDate = new Date(), anotherDate = '') => {
  if (!anotherDate) {
    const [year, month, date] = [aDate.getFullYear(), aDate.getMonth(), aDate.getDate()];
    return new Date(year, month, date);
  }
  let dates = [],
    currentDate = aDate,
    addDays = function (days) {
      let date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };
  while (currentDate <= anotherDate) {
    dates.push(currentDate);
    currentDate = addDays.call(currentDate, 1);
  }
  return dates;
};

export default getDate;
