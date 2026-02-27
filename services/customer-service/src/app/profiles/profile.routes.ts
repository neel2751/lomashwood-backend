import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileRepository } from './profile.repository';

const profileRepo = new ProfileRepository();
const profileService = new ProfileService(profileRepo);
const profileController = new ProfileController(profileService);

export const profileRouter = Router();
export default profileRouter;

profileRouter.get('/me', profileController.getMyProfile);
profileRouter.put('/me', profileController.updateProfile);
profileRouter.delete('/me', profileController.deleteProfile);
profileRouter.get('/me/addresses', profileController.getAddresses);
profileRouter.post('/me/addresses', profileController.addAddress);
profileRouter.put('/me/addresses/:addressId', profileController.updateAddress);
profileRouter.delete('/me/addresses/:addressId', profileController.deleteAddress);
profileRouter.post('/', profileController.createProfile);
profileRouter.get('/', profileController.getAllProfiles);
profileRouter.get('/:id', profileController.getProfileById);