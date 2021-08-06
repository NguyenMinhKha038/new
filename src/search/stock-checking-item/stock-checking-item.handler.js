export default {
  async findModelInModelList({ model_id = '', model_list = [] }) {
    const existedModel = model_list.find((model) => model.id === model_id);
    return existedModel ? existedModel : null;
  }
};
