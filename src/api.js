// src/api.js

const API_BASE_URL = 'https://ephemeral-backend-lucasgerbasi.onrender.com';

export async function uploadFile(encryptedBlob, onUploadProgress) {
    const formData = new FormData();
    formData.append('encryptedFile', encryptedBlob);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                onUploadProgress(percentComplete);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload.'));
        });

        xhr.open('POST', `${API_BASE_URL}/upload`, true);
        xhr.send(formData);
    });
}

export function getDownloadUrl(fileID) {
    return `${API_BASE_URL}/download/${fileID}`;
}
