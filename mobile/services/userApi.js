import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './adminApi';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const fetchUserProfile = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, { headers });
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, message: 'Network error' };
  }
};

export const fetchUserRecords = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/user/records`, { headers });
    return await response.json();
  } catch (error) {
    console.error('Error fetching user records:', error);
    return { success: false, message: 'Network error' };
  }
};

export const fetchUserTotalAmount = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/user/records/total`, { headers });
    return await response.json();
  } catch (error) {
    console.error('Error fetching total amount:', error);
    return { success: false, message: 'Network error' };
  }
};
