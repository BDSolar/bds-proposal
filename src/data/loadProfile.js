// 24-hour load profile — hourly kWh for each appliance category
export const baseLoad   = [0.4, 0.3, 0.3, 0.3, 0.3, 0.4, 0.5, 0.6, 0.5, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.4, 0.4]
export const hotWater   = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 0.6, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.5, 0.3, 0.0, 0.0, 0.0, 0.0]
export const cooking    = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.3, 0.2, 0.0, 0.0, 0.0, 0.8, 1.5, 1.2, 0.5, 0.0, 0.0, 0.0]
export const evCharging = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.5, 1.5, 1.5, 1.0]
export const lighting   = [0.1, 0.1, 0.0, 0.0, 0.0, 0.0, 0.1, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.3, 0.5, 0.5, 0.5, 0.4, 0.3, 0.2]

export const hours = Array.from({ length: 24 }, (_, i) => i)

export const timeLabels = [
  '12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am',
  '12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm'
]

export const timeFull = [
  '12:00 AM','1:00 AM','2:00 AM','3:00 AM','4:00 AM','5:00 AM',
  '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
  '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:00 PM'
]

export const loadComponents = [
  { key: 'baseLoad', label: 'Base Load', data: baseLoad, color: '#e000f0' },
  { key: 'hotWater', label: 'Hot Water', data: hotWater, color: '#f5a623' },
  { key: 'cooking', label: 'Cooking', data: cooking, color: '#ffd60a' },
  { key: 'evCharging', label: 'EV Charging', data: evCharging, color: '#30d158' },
  { key: 'lighting', label: 'Lighting', data: lighting, color: '#a78bfa' },
]

export function getTotalLoad() {
  return hours.map(h => baseLoad[h] + hotWater[h] + cooking[h] + evCharging[h] + lighting[h])
}

export function getDailyTotal() {
  return getTotalLoad().reduce((a, b) => a + b, 0)
}
