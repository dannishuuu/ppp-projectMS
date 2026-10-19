import { apiClient } from '../utils/apiClient';

export const fileService = {
  async uploadFiles(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await apiClient.post('/files/upload', formData);
    // apiClient already returns parsed data, response is the data itself
    return response;
  },

  async uploadOrganizationFiles(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    // Stored under uploads/organizationdocuments/
    const response = await apiClient.post('/files/upload-organization', formData);
    return response;
  },
  
  async deleteFile(filename) {
    const response = await apiClient.delete(`/files/${filename}`);
    return response;
  },
};