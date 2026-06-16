/**
 * List of known disposable/temporary email domains.
 * Registration from these domains is blocked.
 */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'temp-mail.org',
  'guerrillamail.com',
  'yopmail.com',
  'throwaway.email',
  'tempmail.com',
  'fakeinbox.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'dispostable.com',
  'trashmail.com',
  'trashmail.me',
  'trashmail.net',
  'maildrop.cc',
  'mailnesia.com',
  'mintemail.com',
  'tempail.com',
  'mohmal.com',
  'getnada.com',
  'emailondeck.com',
  'mailcatch.com',
  'harakirimail.com',
  'jetable.org',
  'trash-mail.com',
  'mytemp.email',
  'tempr.email',
  'discard.email',
  'discardmail.com',
  'spamgourmet.com',
  'mailexpire.com',
  'safetymail.info',
  'filzmail.com',
  'incognitomail.org',
  'mailscrap.com',
  'crazymailing.com',
  'tempinbox.com',
]);

/**
 * Check if an email domain is a known disposable email provider.
 * @param {string} email 
 * @returns {boolean}
 */
function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
}

module.exports = { isDisposableEmail, DISPOSABLE_DOMAINS };
