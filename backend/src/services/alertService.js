const prisma = require('../db/prismaClient');

/**
 * Alert Service — creates Alert rows and emits Socket.io events.
 * io (socket server instance) is injected at call time to avoid circular deps.
 */

async function createAlert({ type, message, recipientId = null, donorId = null, io = null }) {
  try {
    const alert = await prisma.alert.create({
      data: { type, message, recipientId, donorId },
      include: { recipient: true, donor: true },
    });
    if (io) io.emit('alert:created', alert);
    return alert;
  } catch (err) {
    console.error('[AlertService] Failed to create alert:', err.message);
  }
}

async function createNewMatchAlert({ recipientId, donorName, organType, io }) {
  return createAlert({
    type: 'NewMatch',
    message: `New compatible ${organType} match found from donor ${donorName}.`,
    recipientId,
    io,
  });
}

async function createCitWarningAlert({ donorId, recipientId, organType, citHours, limitHours, io }) {
  return createAlert({
    type: 'CITWarning',
    message: `CIT Warning: ${organType} — ${citHours.toFixed(1)}h elapsed of ${limitHours}h limit. Urgent action required.`,
    donorId,
    recipientId,
    io,
  });
}

async function createUrgencyEscalationAlert({ recipientId, recipientName, oldTier, newTier, io }) {
  return createAlert({
    type: 'UrgencyEscalation',
    message: `${recipientName}'s urgency escalated from ${oldTier} → ${newTier}. Review waitlist position.`,
    recipientId,
    io,
  });
}

async function createStatusChangeAlert({ recipientId, recipientName, newStatus, io }) {
  return createAlert({
    type: 'StatusChange',
    message: `${recipientName}'s status changed to ${newStatus}.`,
    recipientId,
    io,
  });
}

module.exports = {
  createAlert,
  createNewMatchAlert,
  createCitWarningAlert,
  createUrgencyEscalationAlert,
  createStatusChangeAlert,
};
