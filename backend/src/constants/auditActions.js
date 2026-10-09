/**
 * Shared audit action constants.
 * All services must import from here — never use raw strings.
 */
const AUDIT_ACTIONS = {
  // Donor lifecycle
  DONOR_REGISTERED:         'DONOR_REGISTERED',
  CONSENT_GIVEN:            'CONSENT_GIVEN',
  CONSENT_REVOKED:          'CONSENT_REVOKED',
  DONOR_RISK_COMPUTED:      'DONOR_RISK_COMPUTED',

  // Recipient lifecycle
  RECIPIENT_REGISTERED:     'RECIPIENT_REGISTERED',
  URGENCY_ESCALATED:        'URGENCY_ESCALATED',

  // Match lifecycle
  MATCH_CREATED:            'MATCH_CREATED',
  MATCH_FINALIZED:          'MATCH_FINALIZED',
  MATCH_REJECTED:           'MATCH_REJECTED',
  CIT_EXCEEDED:             'CIT_EXCEEDED',

  // Transplant lifecycle
  TRANSPLANT_COMPLETED:     'TRANSPLANT_COMPLETED',
  TRANSPLANT_FAILED:        'TRANSPLANT_FAILED',

  // Exchange
  EXCHANGE_PROPOSED:        'EXCHANGE_PROPOSED',
  EXCHANGE_ACTIVATED:       'EXCHANGE_ACTIVATED',
  EXCHANGE_BROKEN:          'EXCHANGE_BROKEN',

  // Auth
  USER_LOGIN:               'USER_LOGIN',
  USER_LOGOUT:              'USER_LOGOUT',
};

module.exports = { AUDIT_ACTIONS };
