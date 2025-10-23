import { useState } from 'react';
import StarRating from '../starRating/StarRating';
import Button from '../button/Button';
import TextField from '../textField/TextField';
import Checkbox from '../checkbox/Checkbox';
import { useNotification } from '../../hooks/useNotification';

const ReviewForm = ({ eventId, onSubmit, onCancel }) => {
    const { showNotification } = useNotification();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            showNotification('Please select a rating', 'error');
            return;
        }
        
        if (!comment.trim()) {
            showNotification('Please write a comment', 'error');
            return;
        }

        if (comment.trim().length < 10) {
            showNotification('Comment must be at least 10 characters long', 'error');
            return;
        }

        if (comment.trim().length > 500) {
            showNotification('Comment cannot exceed 500 characters', 'error');
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Simulate API call with mock data
            const newReview = {
                id: Date.now(), // Simple ID generation for mock
                eventId,
                userId: 999, // Mock current user ID
                userName: isAnonymous ? 'Anonymous' : 'Current User',
                userEmail: 'current.user@concordia.ca',
                rating,
                comment: comment.trim(),
                createdAt: new Date().toISOString(),
                isAnonymous
            };

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            onSubmit(newReview);
            showNotification('Review submitted successfully!', 'success');
            
            // Reset form
            setRating(0);
            setComment('');
            setIsAnonymous(false);
        } catch (error) {
            showNotification('Failed to submit review. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setRating(0);
        setComment('');
        setIsAnonymous(false);
        onCancel();
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Write a Review
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rating Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rating *
                    </label>
                    <StarRating
                        rating={rating}
                        onRatingChange={setRating}
                        interactive={true}
                        size="lg"
                        showLabel={true}
                    />
                </div>

                {/* Comment Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Comment *
                    </label>
                    <TextField
                        id="comment"
                        name="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this event..."
                        multiline={true}
                        rows={4}
                        maxLength={500}
                        required
                    />
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {comment.length}/500 characters
                    </div>
                </div>

                {/* Anonymous Option */}
                <div className="flex items-center">
                    <Checkbox
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(checked) => setIsAnonymous(checked)}
                    />
                    <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Submit anonymously
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting || rating === 0 || !comment.trim()}
                        className="flex-1"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ReviewForm;
