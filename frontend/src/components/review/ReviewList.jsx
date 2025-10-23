import StarRating from '../starRating/StarRating';

const ReviewList = ({ reviews, averageRating, totalReviews }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (reviews.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to share your experience!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Average Rating Summary */}
            {averageRating > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Overall Rating
                        </h4>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {averageRating}/5
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <StarRating 
                            rating={averageRating} 
                            size="lg" 
                            interactive={false}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                        </span>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Reviews ({reviews.length})
                </h4>
                
                {reviews.map((review) => (
                    <div 
                        key={review.id} 
                        className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                                        {review.isAnonymous ? 'A' : review.userName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {review.isAnonymous ? 'Anonymous' : review.userName}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(review.createdAt)}
                                    </div>
                                </div>
                            </div>
                            <StarRating 
                                rating={review.rating} 
                                size="sm" 
                                interactive={false}
                            />
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {review.comment}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewList;
