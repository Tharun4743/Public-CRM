export const getCitizenToken = () => localStorage.getItem('citizen_token');

export const getCitizenUser = () => {
  const token = getCitizenToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (error) {
    return null;
  }
};

export const isCitizenLoggedIn = () => {
  const token = getCitizenToken();
  if (!token || token === 'undefined' || token === 'null' || token === '') return false;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime && decoded.role === 'Citizen';
  } catch (error) {
    return false;
  }
};

export const logoutCitizen = () => {
  localStorage.removeItem('citizen_token');
  window.location.href = '/citizen-login';
};
