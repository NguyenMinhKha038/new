import storeModel from '../store/store.model';
import companyModel from '../company/company.model';
import productModel from '../product/product.model';
import categoryModel from '../category/category.model';
import userModel from '../../commons/user/user.model';
import promotionModel from '../promotion/promotion.model';
import providerModel from '../provider/provider.model';

const SearchTypes = {
  store: storeModel,
  company: companyModel,
  product: productModel,
  category: categoryModel,
  user: userModel,
  promotion: promotionModel,
  provider: providerModel
};

const DefaultLimit = 20;
const MaxLimit = 50;

export default {
  SearchTypes,
  DefaultLimit,
  MaxLimit
};
