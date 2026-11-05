import { prisma } from '../prisma';

export async function generateDoctorTaskReminders(practiceId: string, hoursBefore = 24) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      practiceId,
      status: { in: ['booked', 'checked_in'] },
      startsAt: { gte: now, lte: windowEnd },
      reminderSent: false,
    },
    include: { patient: true },
  });

  const reminders = [];
  for (const appt of appointments) {
    const message = `Reminder: Appointment with ${appt.patient.firstName} ${appt.patient.lastName} at ${appt.startsAt.toISOString()} (${appt.appointmentType || 'General'})`;
    // Create notification/task record via audit/event or return for UI
    reminders.push({
      appointmentId: appt.id,
      patientName: `${appt.patient.firstName} ${appt.patient.lastName}`,
      startsAt: appt.startsAt,
      message,
    });
    // Mark as reminded
    await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSent: true } });
  }
  return reminders;
}
