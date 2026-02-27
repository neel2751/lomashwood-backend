import { Request, Response } from 'express';
import RoleService from './role.service';

export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const role = await this.roleService.createRole(req.body);
      res.status(201).json({ success: true, data: role });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await this.roleService.getAllRoles(req.query as any);
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const role = await this.roleService.getRoleById(req.params['id'] as string);
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getRoleByName(req: Request, res: Response): Promise<void> {
    try {
      const role = await this.roleService.getRoleByName(req.params['name'] as string );
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const role = await this.roleService.updateRole(req.params['id'] as string, req.body);
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      await this.roleService.deleteRole;     await this.roleService.updateRole(req.params['id'] as string, req.body);
      res.status(200).json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async assignPermissions(req: Request, res: Response): Promise<void> {
    try {
      const role = await this.roleService.assignPermissions(req.params['id'] as string , req.body.permissions);
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async removePermissions(req: Request, res: Response): Promise<void> {
    try {
      const role = await this.roleService.removePermissions(req.params['id'] as string, req.body.permissions);
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await this.roleService.getRolePermissions(req.params['id'] as string);
      res.status(200).json({ success: true, data: permissions });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async checkPermission(req: Request, res: Response): Promise<void> {
    try {
      
      const permission = req.query['permission'] as string ?? '';
      const hasPermission = await this.roleService.checkPermission(req.params['id'] as string, permission);
      res.status(200).json({ success: true, data: { hasPermission } });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getUsersByRole(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.roleService.getUsersByRole(req.params['id'] as string, req.query as any);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getRoleStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.roleService.getRoleStats(req.params['id'] as string);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async activateRole(req: Request, res: Response): Promise<void> {
    try {
      const role = await this.roleService.activateRole(req.params['id'] as string);
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async deactivateRole(req: Request, res: Response): Promise<void> {
    try {
      const role = await this.roleService.deactivateRole(req.params['id'] as string);
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async cloneRole(req: Request, res: Response): Promise<void> {
    try {
      const role = await this.roleService.cloneRole(req.params['id'] as string, req.body.name, req.body.description);
      res.status(201).json({ success: true, data: role });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getSystemRoles(_req: Request, res: Response): Promise<void> {
    try {
     
      const roles = await this.roleService.getSystemRoles();
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getCustomRoles(_req: Request, res: Response): Promise<void> {
    try {
      // ✅ Fix 3: renamed unused req to _req
      const roles = await this.roleService.getCustomRoles();
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getAllPermissions(_req: Request, res: Response): Promise<void> {
    try {
      // ✅ Fix 3: renamed unused req to _req
      const permissions = await this.roleService.getAllPermissions();
      res.status(200).json({ success: true, data: permissions });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async bulkAssignRole(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.roleService.bulkAssignRole(req.body.roleId, req.body.userIds);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async exportRoles(req: Request, res: Response): Promise<void> {
    try {
      
      const format = req.query['format'] as string ?? 'json';
      const data = await this.roleService.exportRoles(format);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

export default RoleController;