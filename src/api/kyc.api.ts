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
   * OCR nhận dạng CMND/CCCD bằng Tesseract.js (local OCR)
   * @param imageUri - URI ảnh CCCD
   * @param imageType - 'front' | 'back' — mặt trước hay mặt sau
   */
  recognizeID: async (
    imageUri: string,
    imageType: 'front' | 'back' = 'front',
  ): Promise<{ success: boolean; data: IDRecognitionResult; imageUrl?: string }> => {
    const formData = new FormData();

    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: imageType === 'back' ? 'cccd_back.jpg' : 'cccd_front.jpg',
    } as any);

    // Truyền imageType để backend lưu đúng field
    formData.append('imageType', imageType);

    const response = await apiClient.post('/kyc/recognize-id', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60s: FPT AI (15s) + mutex wait (15s) + Tesseract + Cloudinary
    });

    return response.data;
  },

  /**
   * So khớp khuôn mặt bằng pixel MSE similarity (local)
   * Gửi 2 ảnh (CCCD + selfie) → Backend tính độ tương đồng
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
   * Kiểm tra trạng thái KYC hiện tại (bao gồm reKycReason nếu có)
   */
  getKYCStatus: async (): Promise<{
    status: string;
    idInfo: IDRecognitionResult | null;
    faceMatchScore: number | null;
    completedAt: string | null;
    reKycReason: string | null;
  }> => {
    const response = await apiClient.get('/kyc/status');
    return response.data;
  },
};

export default kycApi;
