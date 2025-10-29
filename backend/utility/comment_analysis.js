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

const connectToDB = require('../config/database.js');
const { Event } = require('../models/Event');

//function to add comment to mongodb (for eventController-comments)
async function addComment(eventId, commentText) {
  await connectToDB();
  await Event.findByIdAndUpdate(
    eventId,
    { $push: { comments: commentText } }, 
  );
}
module.exports = { addComment }; //for eventController

//Fetch all comments for an event
async function getdbComments(eventId) {
  await connectToDB();
  const event = await Event.findById(eventId).lean();
  const text = event.comments;
  return text;
}

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

    return words;
}

function filterStopWords(words) {
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

//5. OPTIONAL task.05 - commonly associated words with the top 10 words
function getAssociatedWords(words, topWords) {
    const associations = {};

    for (const [word] of topWords) {
        associations[word] = {}; //count
    }

    for (let i = 0; i < words.length; i++) {
        const current = words[i];

        // Check if this word is one of the top 10
        for (const [topWord] of topWords) {
            if (current === topWord) {
                // look at the word before and after
                const before = words[i - 1];
                const after = words[i + 1];

                if (before && before !== topWord) {
                    associations[topWord][before] = (associations[topWord][before] || 0) + 1;
                }
                if (after && after !== topWord) {
                    associations[topWord][after] = (associations[topWord][after] || 0) + 1;
                }
            }
        }
    }

    // Rank and limit to top 3
    const rankedAssociations = [];
    for (const topWord in associations) {
        const ranked = Object.entries(associations[topWord])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        rankedAssociations.push({
            topWord,
            associated: ranked.length
                ? ranked.map(([word, freq]) => `${word} (${freq})`).join(', ')
                : '[]',
        });
    }

    return rankedAssociations;
}

//TEST
const testText = `
    amazing EVEnt!!! it was SO HORRIBLE??_ amazing but so bad, so bad, very bad also.
    amazing EVEnt!!! it was SO HORRIBLE??_ amazing but so kinda bad, so bad, very bad maybe.
    amazing good!!! blablba HORRIBLE??_ amazing but so kinda bad, so bad, very bad.
    new sentence new words new words new words new words new words
    hello hello why tho
    amazing EVEnt!!! it was SO HORRIBLE??_ amazing but so bad, so bad, very bad also.
    amazing EVEnt!!! it was SO HORRIBLE??_ amazing but so kinda bad, so bad, very bad maybe.
    amazing good!!! blablba HORRIBLE??_ amazing but so kinda bad, so bad, very bad.
    new sentence new words new words new words new words new words
    hello hello why tho
    amazing EVEnt!!! it was SO HORRIBLE??_ amazing but so bad, so bad, very bad also.
    amazing EVEnt!!! it was SO HORRIBLE??_ amazing but so kinda bad, so bad, very bad maybe.
    amazing good!!! blablba HORRIBLE??_ amazing but so kinda bad, so bad, very bad.
    new sentence new words new words new words new words new words
    hello hello why tho
    horrible weather though, ruined the AMAZING setup :( bad, bad rain everywhere.
    amazing show, horrible sound system, but the food was SO GOOD!!
    wow, such a weird mix of good and bad, amazing people but horrible seats.
    overall, amazing but also bad?? confused, but happy
    horrible weather though, ruined the AMAZING setup :( bad, bad rain everywhere.
    amazing show, horrible sound system, but the food was SO GOOD!!
    wow, such a weird mix of good and bad, amazing people but horrible seats.
    overall, amazing but also bad?? confused, but happy
    horrible weather though, ruined the AMAZING setup :( bad, bad rain everywhere.
    amazing show, horrible sound system, but the food was SO GOOD!!
    wow, such a weird mix of good and bad, amazing people but horrible seats.
    overall, amazing but also bad?? confused, but happy

`;
const cleanedWords = cleanText(testText);
const filteredWords = filterStopWords(cleanedWords);
const wordFrequency = countWordFrequency(filteredWords);
const rankedWords = rankWords(wordFrequency);
const top10 = top10Words(rankedWords);
const associatedWords = getAssociatedWords(cleanedWords, top10);

console.log('Cleaned Words:', cleanedWords);
console.log('Word Frequency:', wordFrequency);
console.log('Ranked Words:');
console.table(rankedWords)
console.log('Top 10 Words:');
console.table(top10);
console.log('Ranked Associated Words:');
console.table(associatedWords);
