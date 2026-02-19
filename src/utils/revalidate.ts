"use server";
import { revalidateTag } from "next/cache";

export async function revalidateBookings() {
  revalidateTag("book", { expire: 0 });
  revalidateTag("rooms", { expire: 0 });
}

export async function revalidateReservation() {
  revalidateTag("rooms", { expire: 0 });
  revalidateTag("reserve", { expire: 0 });
}

export async function revalidatePayment() {
  revalidateTag("payments", { expire: 0 });
  revalidateTag("book", { expire: 0 });
}

export async function revalidateRooms() {
  revalidateTag("rooms", { expire: 0 });
}
