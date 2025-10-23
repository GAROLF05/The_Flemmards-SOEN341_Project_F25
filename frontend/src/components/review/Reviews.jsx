import { useState, useEffect } from 'react';
import { getReviewsForEvent, getAverageRatingForEvent, getReviewCountForEvent } from '../../utils/mockData';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import Button from '../button/Button';

const Reviews = ({ eventId }) => {
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [hasUserReviewed, setHasUserReviewed] = useState(false);

    useEffect(() => {
        // Load reviews for this event
        const eventReviews = getReviewsForEvent(eventId);
        const avgRating = getAverageRatingForEvent(eventId);
        const reviewCount = getReviewCountForEvent(eventId);
        
        setReviews(eventReviews);
        setAverageRating(avgRating);
        setTotalReviews(reviewCount);
        
        // Check if current user has already reviewed (mock check)
        const currentUserId = 999; // Mock current user ID
        const userReview = eventReviews.find(review => review.userId === currentUserId);
        setHasUserReviewed(!!userReview);
    }, [eventId]);

    const handleReviewSubmit = (newReview) => {
        // Add new review to the list
        setReviews(prevReviews => [newReview, ...prevReviews]);
        
        // Update average rating and count
        const updatedReviews = [newReview, ...reviews];
        const newAvgRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0) / updatedReviews.length;
        setAverageRating(Math.round(newAvgRating * 10) / 10);
        setTotalReviews(updatedReviews.length);
        
        // Mark that user has reviewed
        setHasUserReviewed(true);
        
        // Hide the form
        setShowReviewForm(false);
    };

    const handleCancelReview = () => {
        setShowReviewForm(false);
    };

    return (
        <div className="space-y-6">
            {/* Reviews Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Reviews & Ratings
                </h3>
                {!hasUserReviewed && !showReviewForm && (
                    <Button
                        variant="primary"
                        onClick={() => setShowReviewForm(true)}
                        className="text-sm"
                    >
                        Write a Review
                    </Button>
                )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
                <ReviewForm
                    eventId={eventId}
                    onSubmit={handleReviewSubmit}
                    onCancel={handleCancelReview}
                />
            )}

            {/* Reviews List */}
            <ReviewList
                reviews={reviews}
                averageRating={averageRating}
                totalReviews={totalReviews}
            />
        </div>
    );
};

export default Reviews;
