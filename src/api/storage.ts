import { api } from "../../convex/_generated/api";

/**
 * ຟັງຊັ່ນສຳລັບອັບໂຫຼດໄຟລ໌ໄປຍັງ Convex Storage
 * @param blob - ໄຟລ໌ Blob ທີ່ຕ້ອງການອັບໂຫຼດ
 * @param uploadUrl - URL ສຳລັບອັບໂຫຼດໄຟລ໌
 * @returns ລະຫັດຂອງໄຟລ໌ໃນ storage (storageId)
 */
export const uploadFileToStorage = async (
  blob: Blob, 
  uploadUrl: string
): Promise<string> => {
  try {
    // POST the file to the URL
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    });
    
    if (!result.ok) {
      throw new Error(`Upload failed with status: ${result.status}`);
    }
    
    // Get the storage ID
    const { storageId } = await result.json();
    console.log("File uploaded to storage, storageId:", storageId);
    
    return storageId;
  } catch (error) {
    console.error("Error uploading file to storage:", error);
    throw error;
  }
};
