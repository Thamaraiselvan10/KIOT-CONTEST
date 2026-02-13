import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    baseURL: '/api'
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    getProfile: () => api.get('/auth/me')
};

// Contest API
export const contestAPI = {
    getAll: () => api.get('/contests'),
    getOne: (id) => api.get(`/contests/${id}`),
    create: (data) => api.post('/contests', data),
    update: (id, data) => api.put(`/contests/${id}`, data),
    delete: (id) => api.delete(`/contests/${id}`)
};

// Registration API
export const registrationAPI = {
    register: (data) => api.post('/registrations', data),
    getMy: () => api.get('/registrations/my'),
    getByContest: (id) => api.get(`/registrations/contest/${id}`),
    cancel: (id) => api.delete(`/registrations/${id}`)
};

// Team API
export const teamAPI = {
    create: (data) => api.post('/teams', data),
    join: (id) => api.post(`/teams/${id}/join`),
    getByContest: (contestId) => api.get(`/teams/contest/${contestId}`),
    getOne: (id) => api.get(`/teams/${id}`),
    getMy: () => api.get('/teams/my/all'),
    leave: (id) => api.delete(`/teams/${id}/leave`)
};

// Mentor API
export const mentorAPI = {
    getAll: () => api.get('/mentors'),
    create: (data) => api.post('/mentors', data),
    getMyContests: () => api.get('/mentors/my/contests'),
    getMyTeams: () => api.get('/mentors/my/teams'),
    assignToContest: (data) => api.post('/mentors/assign/contest', data),
    assignToTeam: (data) => api.post('/mentors/assign/team', data)
};

// Chat API
export const chatAPI = {
    getMyGroups: () => api.get('/chat/my-groups'),
    getMessages: (contestId, params) => api.get(`/chat/${contestId}`, { params }),
    sendMessage: (contestId, data) => api.post(`/chat/${contestId}`, data),
    deleteMessage: (messageId) => api.delete(`/chat/message/${messageId}`)
};

export default api;
