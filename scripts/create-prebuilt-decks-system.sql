-- Create tables for pre-built decks and enhanced content library

-- Pre-built flashcard decks
CREATE TABLE IF NOT EXISTS prebuilt_flashcard_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES flashcard_subjects(id),
    category VARCHAR(100) NOT NULL, -- 'featured', 'popular', 'new', 'community'
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
    total_cards INTEGER DEFAULT 0,
    estimated_time_minutes INTEGER, -- estimated study time
    tags TEXT[],
    cover_image_url TEXT,
    author_name VARCHAR(255) DEFAULT 'Studify Team',
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-built deck flashcards (many-to-many relationship)
CREATE TABLE IF NOT EXISTS prebuilt_deck_flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deck_id UUID REFERENCES prebuilt_flashcard_decks(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(deck_id, flashcard_id),
    UNIQUE(deck_id, order_index)
);

-- Enhanced content library with rich metadata
CREATE TABLE IF NOT EXISTS content_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'concept', 'formula', 'definition', 'example', 'theorem'
    subject_id UUID REFERENCES flashcard_subjects(id),
    topic_id UUID REFERENCES flashcard_topics(id),
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
    keywords TEXT[],
    tags TEXT[],
    source VARCHAR(255),
    author VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User deck ratings and reviews
CREATE TABLE IF NOT EXISTS deck_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deck_id UUID REFERENCES prebuilt_flashcard_decks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Will be linked to auth.users later
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(deck_id, user_id)
);

-- User's personal deck collections
CREATE TABLE IF NOT EXISTS user_deck_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link user decks to collections
CREATE TABLE IF NOT EXISTS collection_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES user_deck_collections(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES user_flashcard_decks(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, deck_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prebuilt_decks_category ON prebuilt_flashcard_decks(category);
CREATE INDEX IF NOT EXISTS idx_prebuilt_decks_subject ON prebuilt_flashcard_decks(subject_id);
CREATE INDEX IF NOT EXISTS idx_prebuilt_decks_featured ON prebuilt_flashcard_decks(is_featured);
CREATE INDEX IF NOT EXISTS idx_content_library_subject ON content_library(subject_id);
CREATE INDEX IF NOT EXISTS idx_content_library_topic ON content_library(topic_id);
CREATE INDEX IF NOT EXISTS idx_content_library_keywords ON content_library USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_deck_flashcards_deck ON prebuilt_deck_flashcards(deck_id);
