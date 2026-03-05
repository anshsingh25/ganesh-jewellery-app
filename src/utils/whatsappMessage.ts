/**
 * Message template to send to customer via WhatsApp (owner shares manually).
 * Actual WhatsApp API integration would go in a backend.
 */
export function getCustomerPinWhatsAppMessage(name: string, pin: string, mobile: string): string {
  return [
    `Namaste ${name} 🙏`,
    '',
    'Welcome to Ganesh Jewellers EMI scheme.',
    '',
    `Your Customer Login PIN: *${pin}*`,
    '',
    'Use this PIN with your registered mobile number to login to the Ganesh Jewellers app and view your EMI, due dates & receipts.',
    '',
    '— Ganesh Jewellers',
  ].join('\n');
}
