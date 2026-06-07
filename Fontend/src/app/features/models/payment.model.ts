export interface PaymentDTO {
  paymentId: number;

  refId: number;

  refName: string;

  amount: number;

  paymentMethod: number;

  status?: number;

  transactionCode?: string;

  paidAt?: string;

  createdDate?: string;
}
