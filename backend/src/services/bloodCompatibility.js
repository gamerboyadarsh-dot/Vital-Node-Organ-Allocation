/**
 * services/bloodCompatibility.js
 * Module: Registry / Compatibility Engine
 *
 * ABO/Rh compatibility matrix implementation.
 * Maps each blood group to the set of recipient blood groups it can donate to.
 * Encoded BOTH ways:
 *   - DONOR_CAN_GIVE_TO: "who can I (donor) give to?"
 *   - RECIPIENT_CAN_RECEIVE_FROM: "who can give to me (recipient)?"
 */

// Donor blood group -> array of recipient blood groups they can donate to
const DONOR_CAN_GIVE_TO = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

// Recipient blood group -> array of donor blood groups they can receive from
const RECIPIENT_CAN_RECEIVE_FROM = {
  'O-':  ['O-'],
  'O+':  ['O-', 'O+'],
  'A-':  ['O-', 'A-'],
  'A+':  ['O-', 'O+', 'A-', 'A+'],
  'B-':  ['O-', 'B-'],
  'B+':  ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal recipient
};

const ALL_BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

/**
 * Check if a donor's blood group is compatible with a recipient's blood group.
 * @param {string} donorBloodGroup
 * @param {string} recipientBloodGroup
 * @returns {boolean}
 */
function isBloodCompatible(donorBloodGroup, recipientBloodGroup) {
  const compatibleRecipients = DONOR_CAN_GIVE_TO[donorBloodGroup];
  if (!compatibleRecipients) return false;
  return compatibleRecipients.includes(recipientBloodGroup);
}

/**
 * Get all recipient blood groups a donor can give to.
 * @param {string} donorBloodGroup
 * @returns {string[]}
 */
function getCompatibleRecipientGroups(donorBloodGroup) {
  return DONOR_CAN_GIVE_TO[donorBloodGroup] || [];
}

/**
 * Get the full compatibility matrix as a 2D structure for frontend rendering.
 * Returns array of { donor, recipient, compatible }
 */
function getCompatibilityMatrix() {
  const matrix = [];
  for (const donor of ALL_BLOOD_GROUPS) {
    for (const recipient of ALL_BLOOD_GROUPS) {
      matrix.push({
        donor,
        recipient,
        compatible: isBloodCompatible(donor, recipient),
      });
    }
  }
  return matrix;
}

module.exports = {
  isBloodCompatible,
  getCompatibleRecipientGroups,
  getCompatibilityMatrix,
  DONOR_CAN_GIVE_TO,
  RECIPIENT_CAN_RECEIVE_FROM,
  ALL_BLOOD_GROUPS,
};
