import 'server-only';

import { AdminService } from '@/modules/user/admin.service';
import { UserService } from '@/modules/user/user.service';
import { LogService } from '@/services/log-service';
import { getServerDb } from '@/server/db';
import { getSuperAdminToken, resolveRuntimeEnv } from '@/server/runtime';

export function createServerServices(explicitEnv?: Env) {
  const runtimeEnv = resolveRuntimeEnv(explicitEnv);
  const db = getServerDb(runtimeEnv);
  const logService = new LogService(db);
  const userService = new UserService(db);
  const adminService = new AdminService(db, getSuperAdminToken(runtimeEnv), {
    logService,
    userService,
  });

  return {
    runtimeEnv,
    db,
    logService,
    userService,
    adminService,
  };
}
