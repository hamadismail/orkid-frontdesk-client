export enum OTAS {
  BOOKING_COM = 'Booking.com',
  AGODA = 'Agoda',
  TRAVELOKA = 'Traveloka',
  EXPEDIA = 'Expedia',
  WALKING_GUEST = 'Walking Guest',
  TICKET = 'Ticket',
  TRIP_COM = 'Trip.com',
}

export enum PAYMENT_METHOD {
  CREDIT_CARD = 'Credit/Debit Card',
  QR = 'QR/Bank Transfer',
  CITY_LEDGER = 'City Ledger',
  CASH = 'Cash',
}

export enum DEPOSIT_METHOD {
  QR = 'QR/Bank Transfer',
  CASH = 'Cash',
  OC = 'Others Currency',
}

export enum RESERVATION_STATUS {
  RESERVED = 'Reserved',
  CONFIRMED = 'Confirmed',
  CHECKED_IN = 'CheckedIn',
  CHECKED_OUT = 'CheckedOut',
  CANCELLED = 'Cancelled',
  NO_SHOW = 'NoShow',
}

export enum GROUP_STATUS {
  CONFIRMED = 'Confirmed',
  PARTIALLY_CHECKED_IN = 'PartiallyCheckedIn',
  CHECKED_IN = 'CheckedIn',
  CHECKED_OUT = 'CheckedOut',
  CANCELLED = 'Cancelled',
}

export enum PAYMENT_TYPE {
  PAYMENT = 'Payment',
  REFUND = 'Refund',
  DEPOSIT = 'Deposit',
  ADJUSTMENT = 'Adjustment',
}

export enum RoomType {
  SQUEEN = 'Standard Queen Room',
  DTWIN = 'Delux Twin Room',
  DQUEEN = 'Delux Queen Room',
  DTRIPPLE = 'Deluxe Triple Room',
  SFAMILLY = 'Superior Family Room',
  DFAMILLY = 'Deluxe Family Room',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  DUE_OUT = 'DUE_OUT',
  DIRTY = 'DIRTY',
  SERVICE = 'SERVICE',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  NO_SHOW = 'NO_SHOW',
}
