import apiClient from './client';

export interface IDRecognitionResult {
  id: string;
  name: string;
  dob: string;
  sex: string;
  nationality: string;
  home: string;
  address: string;
  doe: string;
  type: string;
  features?: string;
  issue_date?: string;
  issue_loc?: string;
  confidence?: number;
}

export interface FaceMatchResult {
  isMatch: boolean;
  similarity: number;
}

export const kycApi = {
  /**
   * OCR nhận dạng CMND/CCCD
   * Gửi ảnh CMND → FPT.AI → trả về thông tin trích xuất
   */
  recognizeID: async (imageUri: string): Promise<{ success: boolean; data: IDRecognitionResult }> => {
    const formData = new FormData();

    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'cccd.jpg',
    } as any);

    const response = await apiClient.post('/kyc/recognize-id', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    return response.data;
  },

  /**
   * So khớp khuôn mặt
   * Gửi 2 ảnh (CMND + selfie) → FPT.AI → trả về % giống
   */
  matchFaces: async (
    idImageUri: string,
    selfieUri: string,
  ): Promise<{ success: boolean; data: FaceMatchResult }> => {
    const formData = new FormData();

    formData.append('files', {
      uri: idImageUri,
      type: 'image/jpeg',
      name: 'cmnd.jpg',
    } as any);

    formData.append('files', {
      uri: selfieUri,
      type: 'image/jpeg',
      name: 'selfie.jpg',
    } as any);

    const response = await apiClient.post('/kyc/face-match', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    return response.data;
  },

  /**
   * Hoàn tất KYC
   */
  completeKYC: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/kyc/complete');
    return response.data;
  },

  /**
   * Kiểm tra trạng thái KYC
   */
  getKYCStatus: async (): Promise<{
    status: string;
    idInfo: IDRecognitionResult | null;
    faceMatchScore: number | null;
  }> => {
    const response = await apiClient.get('/kyc/status');
    return response.data;
  },
};

export default kycApi;
