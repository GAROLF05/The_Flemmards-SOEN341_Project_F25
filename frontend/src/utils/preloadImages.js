/**
 * Preloads an array of image URLs.
 * @param {string[]} imageUrls - An array of image URLs.
 * @returns {Promise<void>} A promise that resolves when all images are loaded.
 */
const preloadImages = (imageUrls) => {
    const promises = imageUrls.map((url) => {
        return new Promise((resolve) => {
        const img = new Image();
        img.src = url;

        img.onload = () => {
            resolve(); // Resolve the promise when the image loads successfully
        };

        img.onerror = () => {
            // Handle errors if an image fails to load (optional)
            console.error(`Failed to load image: ${url}`);
            resolve(); // Or reject(new Error(...)) if failing is critical
        };
        });
    });

    // Wait for all individual image promises to resolve
    return Promise.all(promises);
};

export default preloadImages;
