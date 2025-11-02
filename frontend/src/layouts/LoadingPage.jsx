const LoadingPage = ({ text = "Loading..." }) => {
    return (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 dark:border-indigo-400"></div>
                <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">{text}</p>
            </div>
        </div>
    );
};

export default LoadingPage;
