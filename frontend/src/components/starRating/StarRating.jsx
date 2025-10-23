import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

const StarRating = ({ 
    rating = 0, 
    onRatingChange, 
    interactive = false, 
    size = 'md',
    showLabel = false 
}) => {
    const [hoverRating, setHoverRating] = useState(0);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    };

    const handleStarClick = (starRating) => {
        if (interactive && onRatingChange) {
            onRatingChange(starRating);
        }
    };

    const handleStarHover = (starRating) => {
        if (interactive) {
            setHoverRating(starRating);
        }
    };

    const handleMouseLeave = () => {
        if (interactive) {
            setHoverRating(0);
        }
    };

    const getStarIcon = (starNumber) => {
        const isFilled = starNumber <= (hoverRating || rating);
        const StarComponent = isFilled ? StarIcon : StarIconOutline;
        
        return (
            <StarComponent
                className={`${sizeClasses[size]} ${
                    isFilled 
                        ? 'text-yellow-400' 
                        : 'text-gray-300 dark:text-gray-600'
                } ${
                    interactive 
                        ? 'cursor-pointer hover:text-yellow-300 transition-colors duration-200' 
                        : ''
                }`}
                onClick={() => handleStarClick(starNumber)}
                onMouseEnter={() => handleStarHover(starNumber)}
                onMouseLeave={handleMouseLeave}
            />
        );
    };

    return (
        <div className="flex items-center gap-1">
            <div className="flex">
                {[1, 2, 3, 4, 5].map((starNumber) => (
                    <span key={starNumber}>
                        {getStarIcon(starNumber)}
                    </span>
                ))}
            </div>
            {showLabel && (
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {rating > 0 ? `${rating}/5` : 'No rating'}
                </span>
            )}
        </div>
    );
};

export default StarRating;
