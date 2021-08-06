export const detachJob = (inputArray) => {
  const detachArray = [[]];
  inputArray.forEach((array) => {
    let existedIndex = -1;
    for (let detachIndex = detachArray.length - 1; detachIndex >= 0; detachIndex--) {
      if (
        detachArray[detachIndex].find(
          (item) => item.product_storing_id.toString() === array.product_storing_id.toString()
        )
      ) {
        existedIndex = detachIndex;
        break;
      }
    }
    if (existedIndex === -1) {
      detachArray[0].push(array);
    } else {
      if (detachArray[existedIndex + 1]) {
        detachArray[existedIndex + 1].push(array);
      } else {
        detachArray.push([array]);
      }
    }
  });
  return detachArray;
};
