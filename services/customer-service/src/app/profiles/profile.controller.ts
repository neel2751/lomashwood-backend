import { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { createProfileSchema, updateProfileSchema, createAddressSchema, updateAddressSchema } from './profile.schemas';
import { parsePaginationOptions } from '../../shared/utils';

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const profile = await this.profileService.getProfileByUserId(userId);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  };

  getProfileById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.profileService.getProfileById(req.params.id!);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  };

  createProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createProfileSchema.parse(req.body);
      const profile = await this.profileService.createProfile(input);
      res.status(201).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const input = updateProfileSchema.parse(req.body);
      const profile = await this.profileService.updateProfile(userId, input);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  };

  deleteProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      await this.profileService.deleteProfile(userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  getAllProfiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const options = parsePaginationOptions(req.query as Record<string, unknown>);
      const result = await this.profileService.getAllProfiles(options);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };

  getAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const addresses = await this.profileService.getAddresses(userId);
      res.status(200).json({ success: true, data: addresses });
    } catch (err) {
      next(err);
    }
  };

  addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const input = createAddressSchema.parse(req.body);
      const address = await this.profileService.addAddress(userId, input);
      res.status(201).json({ success: true, data: address });
    } catch (err) {
      next(err);
    }
  };

  updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const input = updateAddressSchema.parse(req.body);
      const address = await this.profileService.updateAddress(userId, req.params.addressId!, input);
      res.status(200).json({ success: true, data: address });
    } catch (err) {
      next(err);
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      await this.profileService.deleteAddress(userId, req.params.addressId!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}