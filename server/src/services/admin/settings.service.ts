import { PlatformSettings, IPlatformSettings } from '../../models';
import { auditLogService } from '../auditLog.service';
import { AuthenticatedRequest } from '../../types';

export class AdminSettingsService {
  async get() {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({ platformName: 'TapMenu' });
    }
    return this.sanitize(settings);
  }

  async update(data: Partial<IPlatformSettings>, req: AuthenticatedRequest) {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({ ...data, updatedBy: req.user!._id });
    } else {
      Object.assign(settings, data, { updatedBy: req.user!._id });
      await settings.save();
    }

    await auditLogService.logFromRequest(req, 'settings_updated', 'platform_settings', settings._id.toString());
    return this.sanitize(settings);
  }

  private sanitize(settings: IPlatformSettings) {
    const obj = settings.toObject();
    if (obj.smtp?.password) obj.smtp.password = '********';
    if (obj.razorpay?.keySecret) obj.razorpay.keySecret = '********';
    if (obj.cloudinary?.apiSecret) obj.cloudinary.apiSecret = '********';
    if (obj.whatsapp?.apiKey) obj.whatsapp.apiKey = '********';
    if (obj.sms?.apiKey) obj.sms.apiKey = '********';
    return obj;
  }

  async toggleMaintenance(enabled: boolean, message: string | undefined, req: AuthenticatedRequest) {
    return this.update({ maintenanceMode: enabled, maintenanceMessage: message }, req);
  }

  async updateFeatureFlag(flag: string, enabled: boolean, req: AuthenticatedRequest) {
    const settings = await PlatformSettings.findOne();
    const flags = settings?.featureFlags || {};
    flags[flag] = enabled;
    return this.update({ featureFlags: flags }, req);
  }
}

export const adminSettingsService = new AdminSettingsService();
