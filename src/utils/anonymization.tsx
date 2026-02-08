// Utility functions for anonymizing participant data for event organizers

export interface AnonymizedParticipant {
  id: string;
  displayName: string;
  anonymizedEmail: string;
  anonymizedPhone: string;
}

export function anonymizeParticipant(participant: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}, participantId: string): AnonymizedParticipant {
  return {
    id: participantId,
    displayName: `Participant #${participantId}`,
    anonymizedEmail: anonymizeEmail(participant.email),
    anonymizedPhone: anonymizePhone(participant.phone)
  };
}

export function anonymizeEmail(email: string): string {
  if (!email) return '';
  
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return '***@***';
  
  const localLength = localPart.length;
  let anonymizedLocal = '';
  
  if (localLength <= 2) {
    anonymizedLocal = '*'.repeat(localLength);
  } else {
    // Show first character, then asterisks, then last character if long enough
    anonymizedLocal = localPart[0] + '*'.repeat(Math.max(1, localLength - 2)) + localPart[localLength - 1];
  }
  
  // Anonymize domain part too
  const [domainName, tld] = domain.split('.');
  const domainLength = domainName?.length || 0;
  let anonymizedDomain = '';
  
  if (domainLength <= 2) {
    anonymizedDomain = '*'.repeat(domainLength);
  } else {
    anonymizedDomain = domainName[0] + '*'.repeat(Math.max(1, domainLength - 2)) + domainName[domainLength - 1];
  }
  
  return `${anonymizedLocal}@${anonymizedDomain}.${tld || '***'}`;
}

export function anonymizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters to work with the actual number
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length <= 3) {
    return '*'.repeat(phone.length);
  }
  
  // Keep first and last few digits, anonymize the middle
  const firstPart = digits.slice(0, 2);
  const lastPart = digits.slice(-2);
  const middleLength = Math.max(1, digits.length - 4);
  
  // Reconstruct with original formatting pattern but anonymized digits
  let result = phone;
  let digitIndex = 0;
  let anonymizedIndex = 0;
  
  for (let i = 0; i < phone.length; i++) {
    if (/\d/.test(phone[i])) {
      if (digitIndex < 2) {
        // Keep first 2 digits
        result = result.slice(0, i) + firstPart[digitIndex] + result.slice(i + 1);
      } else if (digitIndex >= digits.length - 2) {
        // Keep last 2 digits
        const lastIndex = digitIndex - (digits.length - 2);
        result = result.slice(0, i) + lastPart[lastIndex] + result.slice(i + 1);
      } else {
        // Replace middle digits with asterisks
        result = result.slice(0, i) + '*' + result.slice(i + 1);
      }
      digitIndex++;
    }
  }
  
  return result;
}