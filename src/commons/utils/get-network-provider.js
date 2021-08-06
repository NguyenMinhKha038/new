function getNetWorkProvider(phoneNumber) {
  let string = phoneNumber.substring(3, 5);
  const telecompany = {
    Viettel: ['32', '33', '34', '35', '36', '37', '38', '39', '86', '96', '97', '98'],
    MobiFone: ['89', '90', '93', '70', '79', '78', '77', '76'],
    Vinaphone: ['88', '91', '94', '83', '84', '85', '81', '82'],
    Vietnamobile: ['92', '56', '58'],
    Gmobile: ['99', '59']
  };
  for (let key in telecompany) {
    if (telecompany[key].indexOf(string) >= 0) return key;
  }
  return null;
}

export default getNetWorkProvider;
