
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(dateString)) return false;
  
  const [, dayStr, monthStr, yearStr] = dateString.match(regex);
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  
  const dateObj = new Date(year, month - 1, day);
  return dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day;
};

export const isValidTime = (timeString) => {
  if (!timeString) return false;
  const regex = /^(\d{2}):(\d{2}) (AM|PM)$/;
  if (!regex.test(timeString)) return false;
  
  const [, hourStr, minStr] = timeString.match(regex);
  const hour = parseInt(hourStr, 10);
  const min = parseInt(minStr, 10);
  
  if (hour < 1 || hour > 12) return false;
  if (min < 0 || min > 59) return false;
  
  return true;
};

export const toStorageDate = (displayDate) => {
  if (!displayDate || !isValidDate(displayDate)) return displayDate; 
  const parts = displayDate.split('/');
  return parts[2] + '-' + parts[1] + '-' + parts[0];
};

export const toDisplayDate = (storageDate) => {
  if (!storageDate) return '';
  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  if (regex.test(storageDate)) {
    const [, year, month, day] = storageDate.match(regex);
    return day + '/' + month + '/' + year;
  }
  return storageDate; 
};

export const formatDateInput = (text) => {
  let digits = text.replace(/\D/g, '');
  if (digits.length > 8) digits = digits.slice(0, 8);
  
  let result = '';
  if (digits.length > 0) result += digits.substring(0, 2);
  if (digits.length > 2) result += '/' + digits.substring(2, 4);
  if (digits.length > 4) result += '/' + digits.substring(4, 8);
  return result;
};

export const formatTimeInput = (text) => {
  let digits = text.replace(/\D/g, '');
  if (digits.length > 4) digits = digits.slice(0, 4);
  
  let result = '';
  if (digits.length > 0) result += digits.substring(0, 2);
  if (digits.length > 2) result += ':' + digits.substring(2, 4);
  return result;
};
