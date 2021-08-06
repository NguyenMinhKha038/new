import categoryService from './category.service';
import { BaseResponse, transactionHelper } from '../../commons/utils';
import adminActivityService from '../../commons/admin-activity/admin-activity.service';
import productTemplateService from '../product-template/product-template.service';
import { Statuses } from '../product-template/product-template.config';
import { PopulatedFields } from './category.config';
import { session } from 'passport';

export default {
  async get(req, res, next) {
    try {
      const { limit, page, select, sort = '-priority', type, parent_id, _id } = req.query;
      const [categories, count] = await Promise.all([
        categoryService.find({
          _id,
          limit,
          page,
          select,
          sort,
          status: 'active',
          type,
          parent_id
        }),
        limit && categoryService.count({ status: 'active', type, parent_id })
      ]);
      const total_page = limit && Math.ceil(count / limit);
      return new BaseResponse({ statusCode: 200, data: categories })
        .addMeta({ total_page, total: count })
        .return(res);
    } catch (error) {
      next(error);
    }
  },
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.findActive(id);
      return new BaseResponse({ statusCode: 200, data: category }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async upload(req, res, next) {
    try {
      const images = req.files && req.files.map((file) => file.path);
      return new BaseResponse({ statusCode: 200, data: images }).return(res);
    } catch (error) {
      next(error);
    }
  },
  admin: {
    async get(req, res, next) {
      try {
        const { limit, page, select, sort, status, type, ...query } = req.query;
        let populate = [
          { path: 'parent_id', select: 'name status' },
          { path: 'user_id', select: 'name' },
          { path: 'admin_id', select: 'name' },
          { path: 'company_category', select: 'name status' },
          { path: 'type_category', select: 'name status' }
        ];
        // if (type === 3) {
        //   populate = populate.concat([
        //     { path: 'company_category', select: 'name status' },
        //     { path: 'type_category', select: 'name status' }
        //   ]);
        // }
        const [categories, count] = await Promise.all([
          categoryService.find({
            limit,
            page,
            select,
            sort,
            status,
            type,
            ...query,
            populate
          }),
          limit && categoryService.count({ status, type, ...query })
        ]);
        const total_page = limit && Math.ceil(count / limit);
        return new BaseResponse({ statusCode: 200, data: categories })
          .addMeta({ total_page, total: count })
          .return(res);
      } catch (error) {
        next(error);
      }
    },
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        const category = await categoryService.findById(id, null, {
          populate: [{ path: 'parent_id', select: 'name status' }]
        });
        return new BaseResponse({ statusCode: 200, data: category }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async post(req, res, next) {
      try {
        const newCategory = req.body;
        const admin_id = req.admin.id;
        const parent =
          +newCategory.type !== 1 && (await categoryService.isValidParent(newCategory));

        let category = await transactionHelper.withSession(async (session) => {
          let category = await categoryService.createAndPopulate(
            {
              ...newCategory,
              admin_id,
              ...(newCategory.type > 1 ? { type_category_id: parent.type_category_id } : {}),
              ...(newCategory.type > 2 ? { company_category_id: parent.company_category_id } : {})
            },
            { session },
            PopulatedFields
          );
          const defaultTemplate = await productTemplateService.createAndPopulate({
            doc: {
              category_id: category._id,
              name: 'Default template',
              status: Statuses.Active,
              allow_unknown_attribute: true
            },
            options: { session }
          });
          return category;
        });

        // Create admin activity
        adminActivityService.create({
          admin_id,
          on_model: 's_category',
          object_id: category._id,
          updated_fields: category,
          type: 'insert',
          snapshot: category,
          resource: req.originalUrl
        });

        return new BaseResponse({ statusCode: 200, data: category }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async put(req, res, next) {
      try {
        const { id } = req.params;
        const updatedCategory = req.body;
        const parent =
          updatedCategory.type > 1 && (await categoryService.isValidParent(updatedCategory));
        const category = await categoryService.findById({ _id: id });
        Object.assign(category, updatedCategory);
        const updatedFields = [...Object.keys(updatedCategory)];
        if (parent) {
          category.type_category_id = parent.type_category_id;
          category.company_category_id = parent.company_category_id;
          updatedFields.push('type_category_id', 'company_category_id');
        }

        if (category.type === 3) {
          category.sub_category_id = category._id;
          updatedFields.push('sub_category_id');
        }
        if (category.type === 2) {
          category.company_category_id = category._id;
          category.sub_category_id = undefined;
          updatedFields.push('company_category_id', 'sub_category_id');
        }
        if (category.type === 1) {
          category.type_category_id = category._id;
          category.company_category_id = undefined;
          category.sub_category_id = undefined;
          updatedFields.push('type_category_id', 'company_category_id', 'sub_category_id');
        }
        await category.save();
        await category
          .populate([
            { path: 'parent_id', select: 'name status' },
            { path: 'user_id', select: 'name' },
            { path: 'admin_id', select: 'name' },
            { path: 'company_category', select: 'name status' },
            { path: 'type_category', select: 'name status' }
          ])
          .execPopulate();

        // Create admin activity
        adminActivityService.create({
          admin_id: req.admin.id,
          on_model: 's_category',
          object_id: category._id,
          updated_fields: updatedFields,
          type: 'update',
          snapshot: category,
          resource: req.originalUrl
        });

        return new BaseResponse({ statusCode: 200, data: category }).return(res);
      } catch (error) {
        next(error);
      }
    },
    async delete(req, res, next) {
      try {
        const { id } = req.params;
        const deletedCategory = await categoryService.remove({ _id: id });

        if (deletedCategory) {
          // Create admin activity
          adminActivityService.create({
            admin_id: req.admin.id,
            on_model: 's_category',
            object_id: deletedCategory._id,
            updated_fields: deletedCategory,
            type: 'delete',
            snapshot: deletedCategory,
            resource: req.originalUrl
          });
        }

        return new BaseResponse({ statusCode: 200, data: {} }).return(res);
      } catch (error) {
        next(error);
      }
    }
  },
  company: {
    async post(req, res, next) {
      try {
        const newCategory = req.body;
        const user_id = req.user.id;
        const company_id = req.company.id;
        const parent =
          +newCategory.type !== 1 && (await categoryService.isValidParent(newCategory));
        const category = await categoryService.create({
          ...newCategory,
          company_id,
          ...(newCategory.type > 1 ? { type_category_id: parent.type_category_id } : {}),
          ...(newCategory.type > 2 ? { company_category_id: parent.company_category_id } : {})
        });
        return new BaseResponse({ statusCode: 200, data: category }).return(res);
      } catch (error) {
        next(error);
      }
    }
  }
};
