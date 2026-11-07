import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      return `http://${window.location.hostname}:3000`;
    }
    return 'http://localhost:3000';
  }
  
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const localhost = debuggerHost.split(':')[0];
    return `http://${localhost}:3000`;
  }
  
  return 'http://172.28.229.21:3000'; // fallback
};

export const API_BASE_URL = getBaseUrl();


const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const fetchUsers = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, { headers });
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, message: 'Network error' };
  }
};

export const fetchUserById = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, { headers });
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, message: 'Network error' };
  }
};

export const addUser = async (userData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding user:', error);
    return { success: false, message: 'Network error' };
  }
};

export const updateUser = async (id, userData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, message: 'Network error' };
  }
};

export const updateUserStatus = async (id, status) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating user status:', error);
    return { success: false, message: 'Network error' };
  }
};

export const deleteUser = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Network error' };
  }
};

// Record APIs

export const fetchUserRecords = async (userId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/records`, { headers });
    return await response.json();
  } catch (error) {
    console.error('Error fetching records:', error);
    return { success: false, message: 'Network error' };
  }
};

export const fetchUserTotalAmount = async (userId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/records/total`, { headers });
    return await response.json();
  } catch (error) {
    console.error('Error fetching total:', error);
    return { success: false, message: 'Network error' };
  }
};

export const addRecord = async (userId, recordData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(recordData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding record:', error);
    return { success: false, message: 'Network error' };
  }
};

export const fetchRecordById = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/records/${id}`, { headers });
    return await response.json();
  } catch (error) {
    console.error('Error fetching record:', error);
    return { success: false, message: 'Network error' };
  }
};

export const updateRecord = async (id, recordData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/records/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(recordData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating record:', error);
    return { success: false, message: 'Network error' };
  }
};

export const deleteRecord = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/records/${id}`, {
      method: 'DELETE',
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting record:', error);
    return { success: false, message: 'Network error' };
  }
};

export const fetchFamilyMembers = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/user/family`, { headers });
    return await response.json();
  } catch (error) {
    console.error('Error fetching family:', error);
    return { success: false, message: 'Network error' };
  }
};


export const changePassword = async (currentPassword, newPassword) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return await response.json();
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
};


// Contact Admin API
export const sendContactAdminMessage = async (subject, message) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/messages/user`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ subject, message })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to send message');
  return data;
};

export const getUserAdminMessages = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/messages/user`, {
    headers
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch messages');
  return data.data;
};

export const getAllAdminMessages = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/messages/admin`, {
    headers
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch all messages');
  return data.data;
};

export const replyToAdminMessage = async (messageId, replyContent) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/messages/admin/${messageId}/reply`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ adminReply: replyContent })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to send reply');
  return data;
};

// ── Documentation & Reports Management APIs ──────────────────────────────

export const fetchDocsList = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/admin/docs`, { headers });
    const data = await res.json();
    if (data.success) {
      // Cache list locally for offline access
      await AsyncStorage.setItem('tushu_cached_docs_list', JSON.stringify(data.data));
      return data;
    }
    throw new Error(data.message || 'Failed to fetch documentation list');
  } catch (error) {
    console.warn('[adminApi] fetchDocsList offline fallback:', error.message);
    const cached = await AsyncStorage.getItem('tushu_cached_docs_list');
    if (cached) {
      return { success: true, count: JSON.parse(cached).length, data: JSON.parse(cached), isOffline: true };
    }
    return { success: false, message: error.message };
  }
};

export const fetchDocContent = async (fileName) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/admin/docs/${encodeURIComponent(fileName)}`, { headers });
    const data = await res.json();
    if (data.success) {
      // Cache doc content locally
      await AsyncStorage.setItem(`tushu_cached_doc_${fileName}`, data.data.content);
      return data;
    }
    throw new Error(data.message || 'Failed to read document');
  } catch (error) {
    console.warn('[adminApi] fetchDocContent offline fallback:', error.message);
    const cached = await AsyncStorage.getItem(`tushu_cached_doc_${fileName}`);
    if (cached) {
      return { success: true, data: { name: fileName, content: cached }, isOffline: true };
    }
    return { success: false, message: error.message };
  }
};

export const saveDocContent = async (fileName, content) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/admin/docs/${encodeURIComponent(fileName)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    if (data.success) {
      await AsyncStorage.setItem(`tushu_cached_doc_${fileName}`, content);
      return data;
    }
    throw new Error(data.message || 'Failed to save document');
  } catch (error) {
    console.warn('[adminApi] saveDocContent offline fallback:', error.message);
    // Persist to local device storage even if backend network call failed
    await AsyncStorage.setItem(`tushu_cached_doc_${fileName}`, content);
    return { 
      success: true, 
      message: 'Saved to local device cache (Backend sync pending).', 
      isOffline: true 
    };
  }
};

