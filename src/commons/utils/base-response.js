class BaseResponse {
  constructor({ statusCode, data }) {
    this.statusCode = statusCode;
    this.data = data;
  }

  addMeta(meta) {
    Object.assign(this, meta);
    return this;
  }

  return(res) {
    return res.status(this.statusCode).json(this);
  }
}
export default BaseResponse;
