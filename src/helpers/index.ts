/**
 * ແປງ Blob ເປັນ Base64 string
 * @param blob - Blob ທີ່ຕ້ອງການແປງ
 * @returns Promise ທີ່ຄືນຄ່າເປັນ Base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      try {
        const base64data = (reader.result as string).split(',')[1]; // ເອົາສະເພາະຂໍ້ມູນຫຼັງຈາກ base64,
        resolve(base64data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("FileReader error"));
    };
    
    reader.readAsDataURL(blob);
  });
};
