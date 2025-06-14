-- Create comprehensive flashcard system tables

-- Subjects table with extensive categories
CREATE TABLE IF NOT EXISTS flashcard_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Vestibular', 'Ensino Superior', 'Personalizado'
    description TEXT,
    icon VARCHAR(100), -- Icon name for UI
    color VARCHAR(7), -- Hex color for theming
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topics table with hierarchical structure
CREATE TABLE IF NOT EXISTS flashcard_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES flashcard_subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    parent_topic_id UUID REFERENCES flashcard_topics(id), -- For subtopics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES flashcard_topics(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT, -- Additional explanation for complex answers
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    question_type VARCHAR(50) DEFAULT 'text', -- 'text', 'multiple_choice', 'true_false'
    options JSONB, -- For multiple choice questions
    tags TEXT[], -- Array of tags for better categorization
    source VARCHAR(255), -- Source of the question (e.g., 'ENEM 2023', 'Custom')
    created_by UUID REFERENCES profiles(id),
    is_verified BOOLEAN DEFAULT FALSE, -- For quality control
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User flashcard decks
CREATE TABLE IF NOT EXISTS user_flashcard_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    subject_id UUID REFERENCES flashcard_subjects(id),
    total_cards INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for deck-flashcard relationships
CREATE TABLE IF NOT EXISTS deck_flashcards (
    deck_id UUID REFERENCES user_flashcard_decks(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (deck_id, flashcard_id)
);

-- User progress tracking with spaced repetition
CREATE TABLE IF NOT EXISTS user_flashcard_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered')),
    ease_factor DECIMAL(4,2) DEFAULT 2.50, -- For spaced repetition algorithm
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review_date DATE DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    correct_streak INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    correct_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, flashcard_id)
);

-- Study sessions tracking
CREATE TABLE IF NOT EXISTS flashcard_study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES user_flashcard_decks(id),
    cards_studied INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uploaded documents for custom flashcard generation
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    processed_text TEXT,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    generated_cards_count INTEGER DEFAULT 0,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flashcards_topic_id ON flashcards(topic_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_difficulty ON flashcards(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON flashcards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_next_review ON user_flashcard_progress(next_review_date);
CREATE INDEX IF NOT EXISTS idx_deck_flashcards_deck_id ON deck_flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON flashcard_study_sessions(user_id, session_date);
