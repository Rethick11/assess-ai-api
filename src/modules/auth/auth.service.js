import {prisma} from "../../config/prisma.js";
import { adminAuth } from "../../config/firebase.js";

export async function registerUser({ email, password, name, role }) {
  // Create user in Firebase
  const firebaseUser = await adminAuth.createUser({ email, password });

  // Save to Postgres via Prisma
  const user = await prisma.user.create({
    data: {
      uid: firebaseUser.uid,
      email,
      name,
      role,
    },
  });

  return user;
}

export async function loginUser(uid) {
  // Update last_login in Postgres
  const user = await prisma.user.update({
    where: { uid },
    data: { last_login: new Date() },
  });

  return user;
}


export async function getUserByUid(uid) {
  const user = await prisma.user.findUnique({
    where: { uid },
  });
  return user;
}