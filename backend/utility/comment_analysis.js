const stopWords = ["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", 
    "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", 
    "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", 
    "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", 
    "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", 
    "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", 
    "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", 
    "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", "don", "should", "now", "would", "could", "should", 
    "may", "might", "must", "shall", "let", "make", "made", "get", "got", "getting", "seem", "seems", "seemed", "feel", "feels", "felt", 
    "look", "looks", "looked", "going", "go", "went", "gone","say", "says", "said", "tell", "told"];

const testText = `
    amazing EVEnt!!! it was SO HORRIBLE??_ amazing but bad, bad, bad.
    amazing EVEnt!!! it was SO HORRIBLE??_ amazing but bad, bad, bad.
    amazing good!!! blablba HORRIBLE??_ amazing but bad, bad, bad.
    new sentence new words new words new words new words new words
    hello hello why tho
`;

//1. Structure and filter comments    
function cleanText(text) {
    // Remove punctuation
    const cleanText = text  
        .replace(/[.,!?;:()"'`]/g, '') //delete punctuation
        .replace(/_/g, '') //detele underscores
        .replace(/\s+/g, ' '); //replace multiple spaces with a single space
 
    // Convert to lowercase
    const lowerCaseText = cleanText.toLowerCase();

    // Split into words
    const words = lowerCaseText.split(/\s+/).filter(word => word !== '');

    // Filter out stop words
    const filteredWords = [];

    for (const word of words) {
        if (!stopWords.includes(word)) {
            filteredWords.push(word);
        }
    }
    return filteredWords;
}

//2. Count word frequency
function countWordFrequency(words) {
    const wordFrequency = {};

    for (const word of words) {
        if (word in wordFrequency) {
            wordFrequency[word]++;
        } else {
            wordFrequency[word] = 1;
        }
    }

    return wordFrequency;
}

//3. Rank words by frequency (descending order)
function rankWords(wordFrequency) {
    const rankedWords = Object.entries(wordFrequency) //transform to array
       .sort((a, b) => {
        if (a[1] > b[1]) return -1; 
        if (a[1] < b[1]) return 1;  
        return 0;                   
        });

    return rankedWords;
}

//4. Top 10 words by frequency
function top10Words(rankedWords) {
    return rankedWords.slice(0, 10);
}

//TEST
const cleanedWords = cleanText(testText);
const wordFrequency = countWordFrequency(cleanedWords);
const rankedWords = rankWords(wordFrequency);
const top10 = top10Words(rankedWords);

console.log('Cleaned Words:', cleanedWords);
console.log('Word Frequency:', wordFrequency);
console.log('Ranked Words:');
console.table(rankedWords)
console.log('Top 10 Words:');
console.table(top10);
