const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { faker } = require('@faker-js/faker');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database setup
const db = new sqlite3.Database('./music_store.db', (err) => {
    if (err) {
        console.error('Database error:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS generated_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            seed TEXT NOT NULL,
            page INTEGER NOT NULL,
            song_index INTEGER NOT NULL,
            region TEXT NOT NULL,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            album TEXT NOT NULL,
            genre TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(seed, page, song_index, region)
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS user_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            song_id INTEGER NOT NULL,
            seed TEXT NOT NULL,
            region TEXT NOT NULL,
            page INTEGER NOT NULL,
            liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(session_id, song_id, seed, region, page)
        )
    `);
    
    console.log('Database tables initialized');
}

// Word banks for unique titles
const WORD_BANKS = {
    en: {
        adjectives: ['Electric', 'Golden', 'Midnight', 'Summer', 'Urban', 'Wild', 'Ancient', 'Cosmic', 'Fast', 'Right', 'All', 'Never', 'Stuck', 'Smell', 'Unreal', 'Kick', 'Whispering', 'Dancing', 'Silent', 'Falling', 'Rising', 'Broken', 'Fading', 'Shining', 'Lost', 'Found', 'Hidden', 'Secret', 'Eternal', 'Momentary', 'Digital', 'Analog', 'Virtual', 'Physical', 'Organic', 'Synthetic', 'Gentle', 'Harsh', 'Soft', 'Loud', 'Bright', 'Dark', 'Warm', 'Cold', 'Sweet', 'Bitter', 'Young', 'Old'],
        nouns: ['Dream', 'Love', 'Revolution', 'Echo', 'Horizon', 'Symphony', 'Journey', 'Memory', 'Office', 'Elf', 'Ponies', 'Tools', 'Glove', 'Rain', 'Night', 'Day', 'City', 'Ocean', 'Mountain', 'River', 'Forest', 'Desert', 'Island', 'Star', 'Moon', 'Sun', 'Sky', 'Cloud', 'Rainbow', 'Storm', 'Breeze', 'Heart', 'Soul', 'Mind', 'Spirit', 'Body', 'Shadow', 'Light', 'Darkness', 'Machine', 'Robot', 'Circuit', 'Code', 'Data', 'Signal', 'Frequency', 'Wave', 'Angel', 'Demon', 'Ghost', 'Spirit', 'Hero', 'Villain', 'Monster', 'Savior'],
        verbs: ['Go', 'Say', 'Tell', 'Show', 'Play', 'Sing', 'Dance', 'Run', 'Fly', 'Fall', 'Rise', 'Break', 'Mend', 'Create', 'Destroy', 'Build', 'Burn', 'Freeze', 'Melt', 'Whisper', 'Scream', 'Shout', 'Laugh', 'Cry', 'Smile', 'Frown', 'Wink', 'Search', 'Find', 'Lose', 'Keep', 'Give', 'Take', 'Buy', 'Sell', 'Remember', 'Forget', 'Learn', 'Teach', 'Grow', 'Shrink', 'Expand', 'Contract'],
        adverbs: ['Slowly', 'Quickly', 'Softly', 'Loudly', 'Brightly', 'Darkly', 'Warmly', 'Coldly', 'Sweetly', 'Bitterly', 'Gently', 'Harshly', 'Secretly', 'Openly', 'Freely', 'Closely', 'Near', 'Far', 'High', 'Low', 'Deep', 'Shallow', 'Inside', 'Outside'],
        prepositions: ['In', 'On', 'At', 'By', 'With', 'Without', 'Under', 'Over', 'Between', 'Among', 'Through', 'Across', 'Against', 'For', 'From', 'To', 'Towards', 'Away'],
        conjunctions: ['And', 'But', 'Or', 'Nor', 'For', 'Yet', 'So', 'Because', 'Although', 'While']
    },
    bn: {
        adjectives: ['সুন্দর', 'প্রেম', 'মেঘলা', 'বৃষ্টি', 'রাত', 'সকাল', 'নীল', 'সাদা', 'দ্রুত', 'সব', 'গভীর', 'উঁচু', 'নিচু', 'বড়', 'ছোট', 'নতুন', 'পুরানো', 'তাজা', 'বাসি', 'মিষ্টি', 'তিক্ত'],
        nouns: ['গান', 'স্বপ্ন', 'প্রেম', 'জীবন', 'বাংলা', 'কলকাতা', 'ঢাকা', 'ঘোড়া', 'নদী', 'পাহাড়', 'সমুদ্র', 'আকাশ', 'চাঁদ', 'সূর্য', 'তারা', 'মেঘ', 'বৃষ্টি', 'হাওয়া', 'আগুন', 'পানি'],
        verbs: ['যাওয়া', 'আসা', 'করা', 'বলা', 'শোনা', 'দেখা', 'পড়া', 'লিখা', 'গাওয়া', 'নাচা']
    },
    de: {
        adjectives: ['Schön', 'Schnell', 'Alt', 'Neu', 'Laut', 'Leise', 'Fantastisch', 'Wunderbar', 'Alle', 'Nie', 'Jung', 'Alt', 'Groß', 'Klein', 'Weiß', 'Schwarz', 'Rot', 'Blau', 'Grün', 'Gelb'],
        nouns: ['Traum', 'Liebe', 'Nacht', 'Tag', 'Stadt', 'Land', 'Herz', 'Seele', 'Himmel', 'Erde', 'Sonne', 'Moon', 'Sterne', 'Wolken', 'Regen', 'Wind', 'Feuer', 'Wasser'],
        verbs: ['Gehen', 'Kommen', 'Sagen', 'Hören', 'Seen', 'Spielen', 'Singen', 'Tanzen', 'Laufen', 'Fliegen']
    }
};

// Title patterns
const TITLE_PATTERNS = {
    en: [
        (adj, noun, verb, adv, prep, conj) => `${adj} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${adj} ${noun} ${verb}`,
        (adj, noun, verb, adv, prep, conj) => `${verb} ${prep} ${adj} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${noun} ${conj} ${adj} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${adj} ${noun} ${adv}`,
        (adj, noun, verb, adv, prep, conj) => `${verb} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${noun} ${prep} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${adj} ${noun}'s ${verb}`,
        (adj, noun, verb, adv, prep, conj) => `${verb} ${adj} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${noun} ${verb} ${adv}`,
        (adj, noun, verb, adv, prep, conj) => `${adj} ${verb} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${prep} ${adj} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${noun} ${conj} ${verb}`,
        (adj, noun, verb, adv, prep, conj) => `${verb} ${adv} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${adj} ${prep} ${noun}`
    ],
    bn: [
        (adj, noun, verb, adv, prep, conj) => `${adj} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${noun} ${adj}`,
        (adj, noun, verb, adv, prep, conj) => `${adj} ${noun} ${verb}`,
        (adj, noun, verb, adv, prep, conj) => `${noun} ${verb}`
    ],
    de: [
        (adj, noun, verb, adv, prep, conj) => `${adj} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${noun} ${adj}`,
        (adj, noun, verb, adv, prep, conj) => `${adj} ${verb} ${noun}`,
        (adj, noun, verb, adv, prep, conj) => `${verb} ${noun}`
    ]
};

// Seeded random number generator
function createSeededRNG(seed) {
    let value = 0;
    for (let i = 0; i < seed.length; i++) {
        value = (value * 31 + seed.charCodeAt(i)) % 10007;
    }
    
    return function() {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    };
}

// Generate unique title with page in seed
function generateUniqueTitle(seed, region, page, songIndex) {
    const rng = createSeededRNG(`${seed}-${page}-${songIndex}-title`);
    const words = WORD_BANKS[region] || WORD_BANKS.en;
    const patterns = TITLE_PATTERNS[region] || TITLE_PATTERNS.en;
    
    const adj = words.adjectives ? words.adjectives[Math.floor(rng() * words.adjectives.length)] : '';
    const noun = words.nouns ? words.nouns[Math.floor(rng() * words.nouns.length)] : '';
    const verb = words.verbs ? words.verbs[Math.floor(rng() * words.verbs.length)] : '';
    const adv = words.adverbs ? words.adverbs[Math.floor(rng() * words.adverbs.length)] : '';
    const prep = words.prepositions ? words.prepositions[Math.floor(rng() * words.prepositions.length)] : '';
    const conj = words.conjunctions ? words.conjunctions[Math.floor(rng() * words.conjunctions.length)] : '';
    
    const patternIndex = Math.floor(rng() * patterns.length);
    let title = patterns[patternIndex](adj, noun, verb, adv, prep, conj);
    
    if (rng() < 0.2) {
        const punctuations = ['!', '?', '...', '.'];
        title += punctuations[Math.floor(rng() * punctuations.length)];
    }
    
    title = title.split(' ').map(word => {
        if (word.length > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
    }).join(' ');
    
    return title;
}

// Generate unique artist with page in seed
function generateUniqueArtist(seed, region, page, songIndex) {
    const rng = createSeededRNG(`${seed}-${page}-${songIndex}-artist`);
    
    const artistPatterns = {
        en: [
            () => `${faker.person.firstName()} ${faker.person.lastName()}`,
            () => `${faker.person.firstName()} ${faker.person.lastName()}, ${faker.person.jobTitle().split(' ')[0]}`,
            () => `The ${faker.word.adjective()} ${faker.word.noun()}s`,
            () => `${faker.person.lastName()} and ${faker.person.lastName()}`,
            () => `${faker.person.firstName()} ${faker.person.lastName()} ${faker.helpers.arrayElement(['Jr.', 'Sr.', 'III', 'IV'])}`,
            () => `Dr. ${faker.person.lastName()}`,
            () => `${faker.person.firstName()} "${faker.word.adjective()}" ${faker.person.lastName()}`,
            () => `${faker.person.lastName()} ${faker.helpers.arrayElement(['Band', 'Group', 'Crew', 'Collective'])}`,
            () => `${faker.person.firstName()} ${faker.person.lastName()} & ${faker.word.adjective()} ${faker.word.noun()}s`,
            () => `${faker.person.lastName()}'s ${faker.word.adjective()} ${faker.word.noun()}`
        ],
        bn: [
            () => `${faker.person.firstName()} ${faker.person.lastName()}`,
            () => `দল ${faker.word.adjective()} ${faker.word.noun()}`,
            () => `${faker.person.lastName()} এবং ${faker.person.lastName()}`,
            () => `${faker.person.firstName()} ${faker.person.lastName()} ${faker.helpers.arrayElement(['জুনিয়র', 'সিনিয়র'])}`
        ],
        de: [
            () => `${faker.person.firstName()} ${faker.person.lastName()}`,
            () => `Die ${faker.word.adjective()} ${faker.word.noun()}s`,
            () => `${faker.person.lastName()} und ${faker.person.lastName()}`,
            () => `${faker.person.lastName()} ${faker.helpers.arrayElement(['Band', 'Gruppe', 'Crew'])}`
        ]
    };
    
    const patterns = artistPatterns[region] || artistPatterns.en;
    const pattern = patterns[Math.floor(rng() * patterns.length)];
    return pattern();
}

// Generate unique album with page in seed
function generateUniqueAlbum(seed, region, page, songIndex, title) {
    const rng = createSeededRNG(`${seed}-${page}-${songIndex}-album`);
    
    const albumPatterns = [
        () => 'Single',
        () => `${faker.word.adjective()} ${faker.word.noun()}`,
        () => `${faker.word.adjective()} ${faker.word.noun()} ${faker.helpers.arrayElement(['Sessions', 'Collection', 'Album', 'Recordings'])}`,
        () => `${title} ${faker.helpers.arrayElement(['and Other Stories', 'and Friends', '& More'])}`,
        () => `${faker.word.adjective()} ${faker.helpers.arrayElement(['Days', 'Nights', 'Dreams', 'Memories'])}`,
        () => `The ${faker.word.adjective()} ${faker.word.noun()}`,
        () => `${faker.word.noun()} of ${faker.word.noun()}`,
        () => `${faker.word.adjective()} & ${faker.word.adjective()}`,
        () => `${faker.helpers.arrayElement(['My', 'Your', 'Our', 'Their'])} ${faker.word.adjective()} ${faker.word.noun()}`,
        () => `${faker.word.noun()} ${faker.helpers.arrayElement(['Part I', 'Part II', 'Volume 1', 'Volume 2'])}`
    ];
    
    if (rng() < 0.3) {
        return 'Single';
    }
    
    const pattern = albumPatterns[Math.floor(rng() * albumPatterns.length)];
    return pattern();
}

// Generate genre with page in seed
function generateGenre(seed, region, page, songIndex) {
    const rng = createSeededRNG(`${seed}-${page}-${songIndex}-genre`);
    
    const genres = {
        en: ['House', 'Folk', 'Heavy Metal', 'Rock\'n\'Roll', 'Electronic', 'Country', 'Pop', 'Jazz', 'Blues', 'Classical', 'Hip Hop', 'R&B', 'Reggae', 'Funk', 'Disco', 'Techno', 'Dubstep', 'Indie', 'Alternative', 'Punk'],
        bn: ['পপ', 'রক', 'আধুনিক', 'লোক', 'ভক্তিগীতি', 'হাউস', 'ফোক', 'ক্লাসিক্যাল', 'জ্যাজ'],
        de: ['Pop', 'Rock', 'Jazz', 'Elektronisch', 'Klassisch', 'Schlager', 'House', 'Folk', 'Metal', 'Hip Hop']
    };
    
    const genreList = genres[region] || genres.en;
    return genreList[Math.floor(rng() * genreList.length)];
}

// Helper function to determine base likes based on avgLikes with songIndex for distribution
function getBaseLikesFromAvgLikes(avgLikes, songIndex) {
    // Handle edge cases
    if (avgLikes <= 0) return 0;
    if (avgLikes >= 10) return 10;
    
    // For integer avgLikes
    if (Number.isInteger(avgLikes)) {
        return avgLikes;
    }
    
    const floorVal = Math.floor(avgLikes);
    const fractional = avgLikes - floorVal;
    
    // Check if it's a .5 value (like 0.5, 1.5, 2.5, etc.)
    const isHalfValue = Math.abs(fractional - 0.5) < 0.001;
    
    if (isHalfValue) {
        // For .5 values, distribute 50/50 between floor and floor+1
        return (songIndex % 2 === 0) ? floorVal : floorVal + 1;
    } else if (fractional < 0.5) {
        // For values like 0.1, 0.2, 0.3, 0.4, 1.1, 1.2, etc.
        return floorVal;
    } else {
        // For values like 0.6, 0.7, 0.8, 0.9, 1.6, 1.7, etc.
        return floorVal + 1;
    }
}

// Generate lyrics with page in seed
function generateLyrics(song, page) {
    const rng = createSeededRNG(`${song.id}-${page}-${song.title}-lyrics`);
    
    const lyricThemes = {
        'House': [
            `Four-on-the-floor, ${song.title} pounds\nEchoing through the city sounds\n${song.artist}'s rhythm takes control\nFilling up your very soul`,
            `Bass drops heavy, lights flash bright\n${song.title} carries through the night\n${song.artist} mixes hope and fear\nMaking everything crystal clear`
        ],
        'Folk': [
            `${song.title} whispers on the breeze\nThrough the rustling of the trees\n${song.artist} sings of love and loss\nCounting every single cost`,
            `Acoustic strings tell ${song.title}'s tale\n${song.artist}'s voice, gentle as a gale\nStories of the earth and sky\nUnder the old pine trees nearby`
        ],
        'Heavy Metal': [
            `${song.title} through the amp's despair\n${song.artist} doesn't even care\nDrums like thunder, bass like quakes\nWith every single note it makes`,
            `Guitars scream with ${song.title}'s might\n${song.artist} fights through endless night\nMetal hearts and iron wills\nConquering the highest hills`
        ],
        'Rock\'n\'Roll': [
            `${song.title} shakes the room\n${song.artist} chases away the gloom\nLeather jackets, blue suede shoes\nNothing left for us to lose`,
            `Jukebox plays ${song.title} loud\n${song.artist} making us proud\nRebel yells and twisted hips\nRock'n'roll on leather lips`
        ],
        'Electronic': [
            `${song.title} in binary code\n${song.artist} lightens up the load\n0s and 1s in perfect time\nMaking everything just rhyme`,
            `Synthesized dreams of ${song.title}\n${song.artist} making everything alive\nDigital rivers flowing free\nThrough circuits of you and me`
        ],
        'Country': [
            `${song.title} down a dusty road\n${song.artist} lightens up the load\nPickup trucks and cowboy hats\nRemembering where we're at`,
            `Whiskey tears and ${song.title}\n${song.artist} making everything right\nFront porch swings and fireflies\nUnderneath the starlit skies`
        ],
        'Pop': [
            `${song.title} on the radio\n${song.artist} putting on a show\nCatchy hooks and sweet refrain\nWashing away all the pain`,
            `${song.title} in the shopping mall\n${song.artist} answering the call\nShiny, happy, bright and new\nMade especially for you`
        ],
        'Jazz': [
            `${song.title} swings in 4/4 time\n${song.artist} makes the complex rhyme\nSaxophone and upright bass\nMoving at a measured pace`,
            `Improvised, ${song.title} flows\n${song.artist} knows where the music goes\nBlue notes in the evening air\nWithout a single worry or care`
        ]
    };
    
    let templates = lyricThemes[song.genre];
    if (!templates) {
        for (const [genre, temp] of Object.entries(lyricThemes)) {
            if (song.genre.toLowerCase().includes(genre.toLowerCase())) {
                templates = temp;
                break;
            }
        }
    }
    
    if (!templates) {
        templates = [
            `${song.title} plays inside my mind\n${song.artist} leaves the past behind\nMelodies that come and go\nHelping everyone to grow`,
            `In the silence, ${song.title} speaks\n${song.artist} finds what the heart seeks\nThrough the darkness and the light\nMaking everything feel right`
        ];
    }
    
    const selectedTemplate = templates[Math.floor(rng() * templates.length)];
    return selectedTemplate;
}

// Helper function to write strings in WAV header
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Generate deterministic audio data based on seed + songId + genre
function generateDeterministicAudioData(seed, songId, genre) {
    // Create a unique, deterministic hash for this combination
    const uniqueString = `${seed}-${songId}-${genre}`;
    
    // Create deterministic RNG based on the unique string
    const rng = createSeededRNG(uniqueString);
    
    const sampleRate = 44100;
    const duration = 30;
    const numSamples = sampleRate * duration;
    
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);
    
    let offset = 44;
    
    // Generate deterministic musical parameters
    let hash = 0;
    for (let i = 0; i < uniqueString.length; i++) {
        const char = uniqueString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & 0xFFFFFFFF;
    }
    hash = Math.abs(hash);
    
    // Different scale types - deterministic choice
    const scaleTypes = ['major', 'minor', 'pentatonic', 'blues', 'dorian', 'phrygian'];
    const scaleType = scaleTypes[hash % scaleTypes.length];
    
    // Different tempos - deterministic choice
    const tempos = [60, 70, 80, 90, 100, 110, 120, 130, 140];
    const tempoIndex = ((hash >> 8) % tempos.length);
    const bpm = tempos[tempoIndex];
    const beatDuration = 60 / bpm;
    
    // Different base frequencies - deterministic choice
    const baseFreqOptions = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63];
    const freqIndex = ((hash >> 16) % baseFreqOptions.length);
    const baseFreq = baseFreqOptions[freqIndex];
    
    // Different chord progressions - deterministic choice
    const progressions = [
        [0, 5, 3, 4],
        [0, 3, 4, 0],
        [0, 4, 5, 4],
        [2, 5, 1, 4],
        [0, 4, 1, 5],
        [0, 5, 1, 4]
    ];
    const progressionIndex = ((hash >> 12) % progressions.length);
    const progression = progressions[progressionIndex];
    
    // Different instrument types - deterministic choice
    const instruments = ['piano', 'strings', 'pad', 'guitar', 'synth'];
    const instrumentIndex = ((hash >> 20) % instruments.length);
    const instrumentType = instruments[instrumentIndex];
    
    // Genre-specific adjustments
    let hasPad = true;
    let hasArpeggio = true;
    let hasRhythm = true;
    
    const genreHash = genre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const combinedHash = (hash + genreHash) & 0xFFFFFFFF;
    
    switch(genre.toLowerCase()) {
        case 'ambient':
        case 'electronic':
            hasPad = true;
            hasArpeggio = (combinedHash & 1) === 0;
            hasRhythm = false;
            break;
        case 'jazz':
        case 'blues':
            hasPad = false;
            hasArpeggio = true;
            hasRhythm = (combinedHash & 2) === 0;
            break;
        case 'classical':
            hasPad = true;
            hasArpeggio = false;
            hasRhythm = false;
            break;
        case 'folk':
            hasPad = false;
            hasArpeggio = true;
            hasRhythm = (combinedHash & 1) === 0;
            break;
        case 'rock':
        case 'metal':
            hasPad = false;
            hasArpeggio = false;
            hasRhythm = true;
            break;
        default:
            hasPad = (combinedHash & 1) === 0;
            hasArpeggio = (combinedHash & 2) === 0;
            hasRhythm = (combinedHash & 4) === 0;
    }
    
    // Generate the audio samples
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let sample = 0;
        
        const currentBeat = t / beatDuration;
        const currentMeasure = Math.floor(currentBeat / 4);
        const chordIndex = currentMeasure % progression.length;
        const currentChord = progression[chordIndex];
        
        // Calculate chord notes based on scale - deterministic
        let chordNotes;
        if (scaleType === 'major') {
            chordNotes = [
                baseFreq * Math.pow(2, currentChord/12),
                baseFreq * Math.pow(2, (currentChord + 4)/12),
                baseFreq * Math.pow(2, (currentChord + 7)/12)
            ];
        } else if (scaleType === 'minor') {
            chordNotes = [
                baseFreq * Math.pow(2, currentChord/12),
                baseFreq * Math.pow(2, (currentChord + 3)/12),
                baseFreq * Math.pow(2, (currentChord + 7)/12)
            ];
        } else {
            chordNotes = [
                baseFreq * Math.pow(2, currentChord/12),
                baseFreq * Math.pow(2, (currentChord + 3)/12),
                baseFreq * Math.pow(2, (currentChord + 5)/12),
                baseFreq * Math.pow(2, (currentChord + 7)/12),
                baseFreq * Math.pow(2, (currentChord + 10)/12)
            ];
        }
        
        // Main melody - deterministic pattern
        const melodyPattern = (combinedHash >> 24) % 4;
        let melodyFreq;
        
        switch(melodyPattern) {
            case 0:
                melodyFreq = chordNotes[Math.floor(currentBeat) % chordNotes.length];
                break;
            case 1:
                melodyFreq = chordNotes[Math.floor(currentBeat * 2) % chordNotes.length];
                break;
            case 2:
                melodyFreq = chordNotes[Math.floor(currentBeat * 3) % chordNotes.length];
                break;
            case 3:
                const syncBeat = currentBeat + 0.5;
                melodyFreq = chordNotes[Math.floor(syncBeat * 1.5) % chordNotes.length];
                break;
        }
        
        // Generate instrument sound
        if (instrumentType === 'piano') {
            const pianoEnv = Math.exp(-t * 0.3) * (1 - Math.exp(-t * 50));
            sample += 0.3 * Math.sin(2 * Math.PI * melodyFreq * t) * pianoEnv;
            sample += 0.1 * Math.sin(2 * Math.PI * melodyFreq * 2 * t) * pianoEnv * 0.5;
            sample += 0.05 * Math.sin(2 * Math.PI * melodyFreq * 3 * t) * pianoEnv * 0.3;
        } 
        else if (instrumentType === 'strings') {
            const stringEnv = Math.min(1, t * 2) * Math.exp(-t * 0.1);
            sample += 0.4 * Math.sin(2 * Math.PI * melodyFreq * t) * stringEnv;
            const vibrato = Math.sin(2 * Math.PI * 6 * t) * 0.002;
            sample += 0.2 * Math.sin(2 * Math.PI * melodyFreq * (1 + vibrato) * t) * stringEnv * 0.5;
        }
        else if (instrumentType === 'pad') {
            const padEnv = Math.min(1, t * 0.5) * Math.exp(-t * 0.05);
            sample += 0.2 * Math.sin(2 * Math.PI * melodyFreq * t) * padEnv;
            sample += 0.15 * Math.sin(2 * Math.PI * melodyFreq * 1.5 * t) * padEnv;
            sample += 0.1 * Math.sin(2 * Math.PI * melodyFreq * 2 * t) * padEnv;
        }
        else if (instrumentType === 'guitar') {
            const guitarEnv = Math.exp(-t * 2) * (1 - Math.exp(-t * 100));
            sample += 0.25 * Math.sin(2 * Math.PI * melodyFreq * t) * guitarEnv;
            const pickNoise = (rng() - 0.5) * 0.02 * Math.exp(-t * 20);
            sample += pickNoise;
        }
        else if (instrumentType === 'synth') {
            const synthEnv = Math.exp(-t * 0.5) * (1 - Math.exp(-t * 30));
            const sawWave = 2 * (t * melodyFreq % 1) - 1;
            sample += 0.25 * sawWave * synthEnv;
            sample += 0.1 * Math.sin(2 * Math.PI * melodyFreq * t) * synthEnv;
        }
        
        // Bass line - deterministic pattern
        const bassPattern = (combinedHash >> 28) % 3;
        let bassFreq = baseFreq / 2 * Math.pow(2, currentChord/12);
        
        if (bassPattern === 0) {
            const walkStep = Math.floor(currentBeat * 2) % 4;
            bassFreq *= Math.pow(2, walkStep/12);
            sample += 0.2 * Math.sin(2 * Math.PI * bassFreq * t) * Math.exp(-t * 0.2);
        } else if (bassPattern === 1) {
            if (Math.floor(currentBeat) % 2 === 0) {
                sample += 0.15 * Math.sin(2 * Math.PI * bassFreq * t) * Math.exp(-t * 0.3);
            }
        } else {
            const arpNote = chordNotes[Math.floor(currentBeat) % chordNotes.length] / 2;
            sample += 0.18 * Math.sin(2 * Math.PI * arpNote * t) * Math.exp(-t * 0.4);
        }
        
        // Pad/chords in background
        if (hasPad) {
            const padFreq = baseFreq * Math.pow(2, currentChord/12);
            const padEnv = Math.min(1, t * 0.3) * Math.exp(-t * 0.02);
            sample += 0.08 * Math.sin(2 * Math.PI * padFreq * t) * padEnv;
            sample += 0.06 * Math.sin(2 * Math.PI * padFreq * 1.5 * t) * padEnv;
            sample += 0.04 * Math.sin(2 * Math.PI * padFreq * 2 * t) * padEnv;
        }
        
        // Arpeggio
        if (hasArpeggio) {
            const arpSpeed = bpm / 60 * 4;
            const arpIndex = Math.floor(t * arpSpeed) % chordNotes.length;
            const arpFreq = chordNotes[arpIndex] * 2;
            const arpEnv = Math.exp(-(t % (1/arpSpeed)) * arpSpeed * 5);
            sample += 0.12 * Math.sin(2 * Math.PI * arpFreq * t) * arpEnv;
        }
        
        // Rhythm elements
        if (hasRhythm) {
            if (Math.floor(currentBeat) % 4 === 0) {
                const kick = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-(currentBeat % 1) * 15) * 0.08;
                sample += kick;
            }
            
            if (Math.floor(currentBeat * 2) % 2 === 1) {
                const hat = (rng() - 0.5) * Math.exp(-(currentBeat % 0.5) * 25) * 0.03;
                sample += hat;
            }
        }
        
        // Apply overall envelope
        const attack = Math.min(1, t * 2);
        const release = Math.max(0, 1 - (t - (duration - 3)) * 0.3);
        const envelope = attack * release;
        
        sample *= envelope;
        
        // Simple echo effect
        if (i > 500) {
            const delayed = view.getInt16(offset - 1000, true) / 32767 * 0.3;
            sample += delayed;
        }
        
        // Convert to PCM
        sample = Math.max(-0.98, Math.min(0.98, sample));
        const pcm = Math.floor(sample * 32767);
        view.setInt16(offset, pcm, true);
        offset += 2;
    }
    
    return buffer;
}

// Generate review text for expanded view
function generateReview(song) {
    const reviews = [
        `"${song.title}" is a masterpiece from ${song.artist}. The ${song.genre.toLowerCase()} elements blend perfectly with the emotional depth.`,
        `A fresh take on ${song.genre} music. ${song.artist} delivers with "${song.title}" - catchy, memorable, and innovative.`,
        `The production on "${song.title}" is stellar. ${song.artist} shows why they're at the top of the ${song.genre} scene.`,
        `From the first note to the last, "${song.title}" captivates. ${song.artist}'s best work yet from "${song.album}".`,
        `If you're a fan of ${song.genre}, "${song.title}" is essential listening. ${song.artist} at their creative peak.`,
        `"${song.title}" showcases ${song.artist}'s versatility. A perfect blend of melody and rhythm in the ${song.genre} genre.`,
        `This track from "${song.album}" demonstrates why ${song.artist} remains relevant. "${song.title}" is both nostalgic and forward-thinking.`
    ];
    
    const rng = createSeededRNG(`${song.id}-${song.title}-review`);
    return reviews[Math.floor(rng() * reviews.length)];
}

// ==================== API ENDPOINTS ====================

app.get('/api/songs', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const seed = req.query.seed || '58933423';
        const lang = req.query.lang || 'en';
        let avgLikes = parseFloat(req.query.avgLikes) || 0.0;
        
        // Ensure avgLikes is within range and has 1 decimal place
        avgLikes = Math.max(0, Math.min(10, avgLikes));
        avgLikes = Math.round(avgLikes * 10) / 10;
        
        const sessionId = req.query.session || 'default';
        const limit = 20;
        
        console.log(`[API] /songs: page=${page}, seed=${seed}, lang=${lang}, avgLikes=${avgLikes.toFixed(1)}`);
        
        const songs = [];
        let processed = 0;
        
        for (let i = 1; i <= limit; i++) {
            const globalId = (page - 1) * limit + i;
            
            // Check if song exists in database
            db.get(
                `SELECT * FROM generated_data 
                 WHERE seed = ? AND page = ? AND song_index = ? AND region = ?`,
                [seed, page, globalId, lang],
                async (err, row) => {
                    if (err) {
                        console.error('Database error:', err);
                        processed++;
                        if (processed === limit) sendResponse();
                        return;
                    }
                    
                    let song;
                    
                    if (row) {
                        // Song exists, use it
                        song = {
                            id: row.song_index,
                            title: row.title,
                            artist: row.artist,
                            album: row.album,
                            genre: row.genre,
                            seed: row.seed,
                            region: row.region,
                            page: row.page
                        };
                    } else {
                        // Generate new song
                        const title = generateUniqueTitle(seed, lang, page, globalId);
                        const artist = generateUniqueArtist(seed, lang, page, globalId);
                        const album = generateUniqueAlbum(seed, lang, page, globalId, title);
                        const genre = generateGenre(seed, lang, page, globalId);
                        
                        song = {
                            id: globalId,
                            title: title,
                            artist: artist,
                            album: album,
                            genre: genre,
                            seed: seed,
                            region: lang,
                            page: page
                        };
                        
                        // Store in database
                        db.run(
                            `INSERT INTO generated_data 
                            (seed, page, song_index, region, title, artist, album, genre) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [seed, page, globalId, lang, song.title, song.artist, 
                             song.album, song.genre]
                        );
                    }
                    
                    try {
                        // Get base likes
                        const baseLikes = getBaseLikesFromAvgLikes(avgLikes, song.id);
                        
                        // Get user likes
                        db.get(
                            `SELECT 
                                COUNT(*) as total_user_likes,
                                CASE WHEN EXISTS (
                                    SELECT 1 FROM user_likes 
                                    WHERE session_id = ? AND song_id = ? AND seed = ? AND region = ? AND page = ?
                                ) THEN 1 ELSE 0 END as user_liked
                             FROM user_likes 
                             WHERE song_id = ? AND seed = ? AND region = ? AND page = ?`,
                            [sessionId, song.id, seed, lang, page, song.id, seed, lang, page],
                            (likeErr, likeRow) => {
                                if (likeErr) {
                                    console.error('Error getting user likes:', likeErr);
                                    const songWithLikes = {
                                        id: song.id,
                                        title: song.title,
                                        artist: song.artist,
                                        album: song.album,
                                        genre: song.genre,
                                        likes: baseLikes,
                                        baseLikes: baseLikes,
                                        userLikes: 0,
                                        liked: false,
                                        lyrics: generateLyrics(song, page),
                                        review: generateReview(song)
                                    };
                                    songs.push(songWithLikes);
                                } else {
                                    const userLikes = likeRow ? (likeRow.total_user_likes || 0) : 0;
                                    const userLiked = likeRow ? (likeRow.user_liked === 1) : false;
                                    const totalLikes = baseLikes + userLikes;
                                    
                                    const songWithLikes = {
                                        id: song.id,
                                        title: song.title,
                                        artist: song.artist,
                                        album: song.album,
                                        genre: song.genre,
                                        likes: totalLikes,
                                        baseLikes: baseLikes,
                                        userLikes: userLikes,
                                        liked: userLiked,
                                        lyrics: generateLyrics(song, page),
                                        review: generateReview(song)
                                    };
                                    songs.push(songWithLikes);
                                }
                                
                                processed++;
                                if (processed === limit) {
                                    sendResponse();
                                }
                            }
                        );
                        
                    } catch (likeErr) {
                        console.error('Error getting likes:', likeErr);
                        const baseLikes = getBaseLikesFromAvgLikes(avgLikes, song.id);
                        const songWithLikes = {
                            id: song.id,
                            title: song.title,
                            artist: song.artist,
                            album: song.album,
                            genre: song.genre,
                            likes: baseLikes,
                            baseLikes: baseLikes,
                            userLikes: 0,
                            liked: false,
                            lyrics: generateLyrics(song, page),
                            review: generateReview(song)
                        };
                        songs.push(songWithLikes);
                        processed++;
                        if (processed === limit) sendResponse();
                    }
                }
            );
        }
        
        function sendResponse() {
            // Sort songs by ID
            songs.sort((a, b) => a.id - b.id);
            
            res.json({
                success: true,
                songs: songs,
                page: page,
                totalPages: 50,
                seed: seed,
                lang: lang,
                avgLikes: avgLikes,
                sessionId: sessionId
            });
        }
        
    } catch (error) {
        console.error('Error in /api/songs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/audio/:seed/:songId/:genre', (req, res) => {
    const { seed, songId, genre } = req.params;
    
    console.log(`🎵 Generating audio for: seed=${seed}, songId=${songId}, genre=${genre}`);
    
    try {
        const audioBuffer = generateDeterministicAudioData(seed, parseInt(songId), genre);
        
        res.set({
            'Content-Type': 'audio/wav',
            'Content-Length': audioBuffer.byteLength,
            'Content-Disposition': `inline; filename="song_${seed}_${songId}.wav"`,
            'Cache-Control': 'public, max-age=31536000'
        });
        
        res.send(Buffer.from(audioBuffer));
        
    } catch (error) {
        console.error('Error generating audio:', error);
        res.status(500).json({ success: false, error: 'Failed to generate audio' });
    }
});

app.post('/api/like', async (req, res) => {
    try {
        res.json({
            success: false,
            error: 'Like functionality disabled. Use average likes slider instead.',
            total: 0,
            liked: false
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/likes/:songId', async (req, res) => {
    try {
        const { songId } = req.params;
        const { seed, region, page, session = 'default', avgLikes = 0.0 } = req.query;
        
        if (!seed || !region || !page) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required parameters' 
            });
        }
        
        // Calculate base likes
        const baseLikes = getBaseLikesFromAvgLikes(parseFloat(avgLikes), parseInt(songId));
        
        // Get user likes
        db.get(
            `SELECT 
                COUNT(*) as total_user_likes,
                CASE WHEN EXISTS (
                    SELECT 1 FROM user_likes 
                    WHERE session_id = ? AND song_id = ? AND seed = ? AND region = ? AND page = ?
                ) THEN 1 ELSE 0 END as user_liked
             FROM user_likes 
             WHERE song_id = ? AND seed = ? AND region = ? AND page = ?`,
            [session, songId, seed, region, page, songId, seed, region, page],
            (err, row) => {
                if (err) {
                    console.error('Error getting likes:', err);
                    return res.json({
                        success: true,
                        total: baseLikes,
                        base: baseLikes,
                        user: 0,
                        liked: false,
                        songId: parseInt(songId)
                    });
                }
                
                const userLikes = row ? (row.total_user_likes || 0) : 0;
                const userLiked = row ? (row.user_liked === 1) : false;
                const totalLikes = baseLikes + userLikes;
                
                res.json({
                    success: true,
                    total: totalLikes,
                    base: baseLikes,
                    user: userLikes,
                    liked: userLiked,
                    songId: parseInt(songId)
                });
            }
        );
        
    } catch (error) {
        console.error('Error in /api/likes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🎵 Music Store Server Running!
    =================================
    
    📊 Server Information:
    - Local URL: http://localhost:${PORT}
    - API Base: http://localhost:${PORT}/api
    
    ✅ CRITICAL FIXES APPLIED:
    
    1. DETERMINISTIC AUDIO: Same seed + same song → Same exact audio
    2. UNIQUE AUDIO: Different seed or song → Different audio
    3. PARAMETER INDEPENDENCE: Songs don't change with likes slider
    4. REPRODUCIBILITY: Audio is reproducible across sessions
    
    🚀 Access: http://localhost:${PORT}
    =================================
    `);
});