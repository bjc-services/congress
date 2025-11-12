import { db } from "../client";
import { createID } from "../id";
import { User } from "../schema";

async function seedSystemUser() {
  await db.insert(User).values({
    id: createID.SYSTEM_USER_ID,
    name: "System",
    email: "sys.services@bucharim.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: "system",
  });
}

seedSystemUser().catch(console.error);
