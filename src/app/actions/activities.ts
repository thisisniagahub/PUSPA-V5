"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function updateActivityStatus(id: string, newStatus: string) {
  try {
    await db.activity.update({
      where: { id },
      data: { status: newStatus as import('@prisma/client').ActivityStatus },
    });
    revalidatePath("/activities");
    return { success: true };
  } catch (error) {
    console.error("Failed to update activity status:", error);
    return { success: false, error: "Failed to update activity status" };
  }
}
