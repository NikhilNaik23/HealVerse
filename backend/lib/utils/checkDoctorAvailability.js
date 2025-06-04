import moment from "moment";

export const isDoctorAvailable = (workingHours, targetDateTime = moment()) => {
  if (
    !workingHours ||
    !Array.isArray(workingHours.days) ||
    !workingHours.start ||
    !workingHours.end
  ) {
    return false;
  }

  const dayOfWeek = moment(targetDateTime).format("ddd");

  if (!workingHours.days.includes(dayOfWeek)) return false;

  const [startHour, startMinute] = workingHours.start.split(":").map(Number);
  const [endHour, endMinute] = workingHours.end.split(":").map(Number);

  const start = moment(targetDateTime).set({
    hour: startHour,
    minute: startMinute,
    second: 0,
    millisecond: 0,
  });

  const end = moment(targetDateTime).set({
    hour: endHour,
    minute: endMinute,
    second: 0,
    millisecond: 0,
  });

  if (start.isBefore(end)) {
    return targetDateTime.isBetween(start, end);
  } else {
    return targetDateTime.isAfter(start) || targetDateTime.isBefore(end);
  }
};
