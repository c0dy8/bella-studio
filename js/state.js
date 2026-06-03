const _now = new Date();

export const state = {
  step:        1,
  specialist:  null,
  date:        '',
  time:        '',
  form:        { name: '', phone: '', email: '', service: '', serviceDuration: 0, payment: '' },
  calYear:     _now.getFullYear(),
  calMonth:    _now.getMonth(),
  bookedTimes: [],
};
