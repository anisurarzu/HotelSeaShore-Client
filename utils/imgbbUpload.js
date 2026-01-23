// Utility function to upload images to imgbb
import axios from "axios";

/**
 * Uploads an image file to imgbb and returns the URL
 * @param {File} file - The image file to upload
 * @returns {Promise<string|null>} - The image URL or null if upload fails
 */
export const uploadImageToImgbb = async (file) => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    
    if (!apiKey) {
      console.error("IMGBB_API_KEY is not set in environment variables");
      throw new Error("IMGBB_API_KEY is not configured");
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.data && response.data.success && response.data.data) {
      return response.data.data.url;
    }
    
    // Log the error response from imgbb
    console.error("imgbb upload failed:", response.data);
    throw new Error(response.data?.error?.message || "Upload failed");
  } catch (error) {
    console.error("Error uploading image to imgbb:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};

/**
 * Uploads multiple images to imgbb and returns an array of URLs
 * @param {File[]} files - Array of image files to upload
 * @returns {Promise<{urls: string[], errors: string[]}>} - Object with successful URLs and errors
 */
export const uploadMultipleImagesToImgbb = async (files) => {
  const results = await Promise.allSettled(
    files.map((file) => uploadImageToImgbb(file))
  );
  
  const urls = [];
  const errors = [];
  
  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      urls.push(result.value);
    } else {
      const errorMsg = result.reason?.message || `Failed to upload image ${index + 1}`;
      errors.push(errorMsg);
      console.error(`Image ${index + 1} upload failed:`, errorMsg);
    }
  });
  
  return { urls, errors };
};
