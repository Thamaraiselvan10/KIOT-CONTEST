import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { contestAPI, mentorAPI } from '../services/api';
import { useEffect } from 'react';

const CreateContest = () => {
    const navigate = useNavigate();
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        department: '',
        registration_deadline: '',
        submission_deadline: '',
        is_team_based: false,
        max_team_size: 4,
        mentor_id: '',
        image_url: '',
        external_reg_link: '',
        submission_link: ''
    });

    useEffect(() => {
        loadMentors();
    }, []);

    const loadMentors = async () => {
        try {
            const res = await mentorAPI.getAll();
            setMentors(res.data);
        } catch (error) {
            console.error('Failed to load mentors:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = {
                ...formData,
                mentor_id: formData.mentor_id ? parseInt(formData.mentor_id) : null,
                max_team_size: parseInt(formData.max_team_size)
            };

            await contestAPI.create(data);
            navigate('/coordinator');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create contest');
        } finally {
            setLoading(false);
        }
    };

    const departments = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <Link to="/coordinator" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
                ← Back to Dashboard
            </Link>

            <div className="card p-8">
                <h1 className="text-2xl font-bold text-white mb-6">Create New Contest</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contest Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g., Hackathon 2025"
                            required
                        />
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Banner Image URL (Optional)
                        </label>
                        <input
                            type="url"
                            name="image_url"
                            value={formData.image_url}
                            onChange={handleChange}
                            className="input"
                            placeholder="https://example.com/image.jpg"
                        />
                        <p className="text-xs text-gray-500 mt-1">Provide a direct link to an image (e.g. Unsplash)</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input min-h-[100px]"
                            placeholder="Describe the contest..."
                            rows={4}
                        />
                    </div>

                    {/* External Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                External Registration Link (Optional)
                            </label>
                            <input
                                type="url"
                                name="external_reg_link"
                                value={formData.external_reg_link}
                                onChange={handleChange}
                                className="input"
                                placeholder="https://forms.gle/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Submission Link (Optional)
                            </label>
                            <input
                                type="url"
                                name="submission_link"
                                value={formData.submission_link}
                                onChange={handleChange}
                                className="input"
                                placeholder="https://github.com/..."
                            />
                        </div>
                    </div>

                    {/* Location & Department */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="input"
                                placeholder="e.g., Lab 1, Main Hall"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Department
                            </label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="">Select department</option>
                                {departments.map((d) => (
                                    <option key={d} value={d === 'All' ? '' : d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Deadlines */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Registration Deadline *
                            </label>
                            <input
                                type="datetime-local"
                                name="registration_deadline"
                                value={formData.registration_deadline}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Submission Deadline *
                            </label>
                            <input
                                type="datetime-local"
                                name="submission_deadline"
                                value={formData.submission_deadline}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    {/* Team Options */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <label className="flex items-center cursor-pointer mb-4">
                            <input
                                type="checkbox"
                                name="is_team_based"
                                checked={formData.is_team_based}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 bg-transparent"
                            />
                            <span className="ml-3 text-white font-medium">Team-based Contest</span>
                        </label>

                        {formData.is_team_based && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Maximum Team Size
                                </label>
                                <input
                                    type="number"
                                    name="max_team_size"
                                    value={formData.max_team_size}
                                    onChange={handleChange}
                                    className="input w-32"
                                    min="2"
                                    max="10"
                                />
                            </div>
                        )}
                    </div>

                    {/* Mentor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Assign Mentor (Optional)
                        </label>
                        <select
                            name="mentor_id"
                            value={formData.mentor_id}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="">Select mentor</option>
                            {mentors.map((m) => (
                                <option key={m.mentor_id} value={m.mentor_id}>
                                    {m.name} ({m.department})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1"
                        >
                            {loading ? 'Creating...' : 'Create Contest'}
                        </button>
                        <Link to="/coordinator" className="btn-secondary">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateContest;
