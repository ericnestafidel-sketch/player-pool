"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { refundListing } from "@/lib/stripe-billing";
import { requireParentActor } from "@/lib/parent-actor";

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

async function parentId(): Promise<string> {
  return requireParentActor();
}

export async function startCheckout(_formData?: FormData) {
  redirect("/parent/checkout");
}

export async function requestRefund(formData: FormData) {
  const id = await parentId();
  await refundListing(id, text(formData.get("subscriptionId")));
  revalidatePath("/parent");
  revalidatePath("/coach/search");
  redirect("/parent");
}
