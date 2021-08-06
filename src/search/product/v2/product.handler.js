import { omit, uniqBy } from 'lodash';
import { BaseError, errorCode } from '../../../commons/utils';
import { Types } from 'mongoose';

export default {
  takeAllowedAttribute(attObj = {}, allowedAtt) {
    let result = [];
    allowedAtt.forEach((att) => {
      // check whether attributes when create product exist in product template or not
      if (att.is_required && !attObj[att.attribute_id])
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { product: errorCode['client.missingRequiredAttributes'] }
        });
      //checks if the value of that attribute is within the allowable values
      if (attObj[att.attribute_id]) {
        if (
          att.product_attribute.values.indexOf(attObj[att.attribute_id]) == -1 &&
          !att.product_attribute.allow_unlisted_value
        )
          throw new BaseError({
            statusCode: 400,
            error: errorCode.client,
            errors: { product: errorCode['client.productAttributeNotAllow'] }
          });
        result.push({
          product_attribute_id: att.attribute_id,
          value: attObj[att.attribute_id],
          name: att.product_attribute.name,
          display_name: att.product_attribute.display_name
        });
      }
    });
    return uniqBy(result, (r) => r.product_attribute_id);
  },
  handleTierIndex(tierVariantions, tierIndex) {
    let result = [];
    let numberOfVariations;
    const variationLength = tierVariantions ? tierVariantions.length : 0;

    if (variationLength === 0) numberOfVariations = 0;
    if (variationLength === 1) numberOfVariations = tierVariantions[0].values.length;
    if (variationLength === 2)
      numberOfVariations = tierVariantions[0].values.length * tierVariantions[1].values.length;

    tierVariantions &&
      tierVariantions.length &&
      tierVariantions[0].values.forEach((v1, i1) => {
        // just one type of variation
        if (!tierVariantions[1]) {
          const found = tierIndex.find((r) => {
            return variationLength == r.tier_index.length && r.tier_index[0] == i1;
          });
          if (found) {
            // check unique SKU in model_list
            result.some((r) => r.SKU === found.SKU) || found.SKU === ''
              ? result.push(omit(found, 'SKU'))
              : result.push(found);
          } else
            throw new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { product: errorCode['client.invalidTierIndex'] }
            });
          // 2 type of variation
        } else {
          tierVariantions[1].values.forEach((v2, i2) => {
            const found = tierIndex.find((r) => {
              return (
                variationLength == r.tier_index.length &&
                r.tier_index[0] == i1 &&
                r.tier_index[1] == i2
              );
            });
            if (found) {
              // check unique SKU in model_list
              result.some((r) => r.SKU === found.SKU)
                ? result.push(omit(found, 'SKU'))
                : result.push(found);
            } else
              throw new BaseError({
                statusCode: 400,
                error: errorCode.client,
                errors: { product: errorCode['client.invalidTierIndex'] }
              });
          });
        }
      });
    if (result.length != numberOfVariations)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { product: errorCode['client.invalidModelListLength'] }
      });
    return result;
  },
  createCategoryPath(category) {
    let category_path = [];
    let pure_category_path = [];

    category.type_category && pure_category_path.push(category.type_category.pure_name);
    category.type_category && category_path.push(category.type_category.name);

    if (category.type === 3) {
      category.company_category && pure_category_path.push(category.company_category.pure_name);
      pure_category_path.push(category.pure_name);

      category.company_category && category_path.push(category.company_category.name);
      category_path.push(category.name);
    }
    if (category.type === 2) {
      pure_category_path.push(category.pure_name);

      category_path.push(category.name);
    }
    return {
      category_path: category_path.join('/'),
      pure_category_path: pure_category_path.join('/')
    };
  },
  mergeModelList(modelList = [], newModelList = []) {
    const merged = [];
    newModelList.forEach((model) => {
      const matchModel = modelList.find((m) => m.model_id === model.model_id);
      if (matchModel) {
        const existModel = merged.find((m) => m.model_id === model.model_id);
        if (existModel) {
          const newModelId = Types.ObjectId();
          merged.push({ ...model, model_id: newModelId.toString(), _id: newModelId });
        } else
          merged.push({
            ...model,
            model_id: matchModel.model_id,
            _id: matchModel._id
          });
      } else {
        const newModelId = Types.ObjectId();
        merged.push({ ...model, model_id: newModelId.toString(), _id: newModelId });
      }
    });
    return merged;
  },
  mergeStoringModelList(storingModelList = [], productModelList = []) {
    const merged = productModelList.map((model) => {
      model = omit(model, [
        'stock',
        'on_sales_stock',
        'box_stock',
        'batch_box_stock',
        'os_box_stock'
      ]);
      const matchModel = storingModelList.find((m) => m.model_id === model.model_id);
      if (matchModel)
        return {
          ...matchModel.toObject(),
          ...model
        };
      return model;
    });
    return merged;
  }
};
