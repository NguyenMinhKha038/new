import { Schema, model } from 'mongoose';
import configService from '../../commons/config/config.service';

export const companyLogisticsAccountSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId },
    logo: String,
    display_name: String,
    provider: { type: String, enum: ['ghn', 'ghtk'] },
    token: { type: String, select: false },
    is_default: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'disabled'] }
  },
  { timestamps: true }
);

companyLogisticsAccountSchema.methods = {
  async setInfo() {
    const config = await configService.get('logistics_providers');
    const provider = config.find((p) => p.provider === this.provider);
    this.display_name = provider.display_name;
    this.logo = provider.logo;
  }
};

companyLogisticsAccountSchema.index({ company_id: 1, provider: 1 });

export const companyLogisticsAccountModel = model(
  's_company_logistics',
  companyLogisticsAccountSchema
);
