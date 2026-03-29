import { clerkClient } from "@clerk/nextjs/server";

const INITIAL_CREDITS = 5;

export async function getCredits(userId: string): Promise<number> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const credits = user.publicMetadata.credits as number | undefined;
  if (credits === undefined) {
    await setCredits(userId, INITIAL_CREDITS);
    return INITIAL_CREDITS;
  }
  return credits;
}

export async function setCredits(
  userId: string,
  credits: number
): Promise<number> {
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { credits },
  });
  return credits;
}

export async function deductCredit(userId: string): Promise<number> {
  const current = await getCredits(userId);
  if (current <= 0) throw new Error("No credits remaining");
  return setCredits(userId, current - 1);
}

export async function addCredits(
  userId: string,
  amount: number
): Promise<number> {
  const current = await getCredits(userId);
  return setCredits(userId, current + amount);
}
