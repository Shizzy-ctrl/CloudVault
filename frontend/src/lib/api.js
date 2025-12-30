export const API_URL = '/api';

export async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        // Handle non-JSON responses (like Nginx errors)
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}...`);
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'API Request Failed');
        }
        return data;
    } catch (error) {
        throw error;
    }
}

export async function uploadFiles(files, token) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Upload failed with non-JSON response (${response.status}): ${text.substring(0, 100)}...`);
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || 'Upload Failed');
    }
    return data;
}
