import { PowerSyncDatabase } from "@powersync/web";

import { yasumiPowerSyncSchema } from "./schema";

let database: PowerSyncDatabase | null = null;

export function getPowerSyncDatabase(): PowerSyncDatabase {
  if (database === null) {
    database = new PowerSyncDatabase({
      database: {
        dbFilename: "yasumi.db",
      },
      schema: yasumiPowerSyncSchema,
    });
  }

  return database;
}
