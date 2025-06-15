-- Purpose: Consolidates creation of all tables related to the flashcard system,
-- including subjects, topics, flashcards, user decks, progress, prebuilt decks, content library, etc.
-- Ensures correct order and references, including RLS.

-- Flashcard Subjects
CREATE TABLE IF NOT EXISTS public.flashcard_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE, -- Ensure subject names are unique
    category VARCHAR(100) NOT NULL, -- e.g., 'Vestibular', 'Ensino Superior', 'Personalizado'
    description TEXT,
    icon VARCHAR(100), -- Icon name for UI
    color VARCHAR(7), -- Hex color for theming
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.flashcard_subjects IS 'Stores different subjects for flashcards.';

-- Flashcard Topics
CREATE TABLE IF NOT EXISTS public.flashcard_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID NOT NULL REFERENCES public.flashcard_subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    parent_topic_id UUID REFERENCES public.flashcard_topics(id) ON DELETE SET NULL, -- Allow parent topic to be optional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, name) -- Ensure topic names are unique within a subject
);
COMMENT ON TABLE public.flashcard_topics IS 'Stores topics within subjects, can be hierarchical.';

-- Flashcards
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID NOT NULL REFERENCES public.flashcard_topics(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    question_type VARCHAR(50) DEFAULT 'text' CHECK (question_type IN ('text', 'multiple_choice', 'true_false', 'image')),
    options JSONB, -- For multiple choice questions: {"a": "Option A", "b": "Option B", "correct": "a"}
    tags TEXT[],
    source VARCHAR(255),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- User who created it
    is_verified BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (success_rate >= 0 AND success_rate <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.flashcards IS 'Core table for flashcard content.';
CREATE INDEX IF NOT EXISTS idx_flashcards_topic_id ON public.flashcards(topic_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON public.flashcards USING GIN(tags);

-- User Flashcard Decks (Custom decks created by users)
CREATE TABLE IF NOT EXISTS public.user_flashcard_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    subject_id UUID REFERENCES public.flashcard_subjects(id) ON DELETE SET NULL,
    total_cards INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.user_flashcard_decks IS 'Custom flashcard decks created by users.';

-- Deck-Flashcards Junction Table (for user_flashcard_decks)
CREATE TABLE IF NOT EXISTS public.deck_flashcards (
    deck_id UUID NOT NULL REFERENCES public.user_flashcard_decks(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0, -- Order of the card in the deck
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (deck_id, flashcard_id)
);
COMMENT ON TABLE public.deck_flashcards IS 'Links flashcards to user-created decks.';
CREATE INDEX IF NOT EXISTS idx_deck_flashcards_deck_id ON public.deck_flashcards(deck_id);

-- User Flashcard Progress (Spaced Repetition related)
CREATE TABLE IF NOT EXISTS public.user_flashcard_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered', 'difficult')),
    ease_factor DECIMAL(4,2) DEFAULT 2.50 CHECK (ease_factor >= 1.30),
    interval_days INTEGER DEFAULT 1 CHECK (interval_days >= 0),
    repetitions INTEGER DEFAULT 0 CHECK (repetitions >= 0),
    next_review_date DATE DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    correct_streak INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    correct_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, flashcard_id)
);
COMMENT ON TABLE public.user_flashcard_progress IS 'Tracks user progress with individual flashcards for spaced repetition.';
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id_flashcard_id ON public.user_flashcard_progress(user_id, flashcard_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_next_review ON public.user_flashcard_progress(next_review_date);

-- Flashcard Study Sessions
CREATE TABLE IF NOT EXISTS public.flashcard_study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES public.user_flashcard_decks(id) ON DELETE SET NULL, -- Can be null if studying loose cards
    prebuilt_deck_id UUID REFERENCES public.prebuilt_flashcard_decks(id) ON DELETE SET NULL, -- Link to prebuilt deck if used
    cards_studied INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_one_deck_type CHECK ((deck_id IS NOT NULL AND prebuilt_deck_id IS NULL) OR (deck_id IS NULL AND prebuilt_deck_id IS NOT NULL) OR (deck_id IS NULL AND prebuilt_deck_id IS NULL))
);
COMMENT ON TABLE public.flashcard_study_sessions IS 'Logs user study sessions.';
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.flashcard_study_sessions(user_id, session_date);

-- Uploaded Documents (for generating flashcards from user content)
CREATE TABLE IF NOT EXISTS public.uploaded_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL, -- Stored filename (e.g., UUID.pdf)
    original_filename VARCHAR(255) NOT NULL, -- User's original filename
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),
    storage_path TEXT, -- Path in Supabase Storage
    processed_text TEXT, -- Extracted text
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
    generated_cards_count INTEGER DEFAULT 0,
    error_message TEXT, -- If processing failed
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);
COMMENT ON TABLE public.uploaded_documents IS 'Stores information about documents uploaded by users for flashcard generation.';

-- Pre-built Flashcard Decks (Curated decks)
CREATE TABLE IF NOT EXISTS public.prebuilt_flashcard_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    subject_id UUID REFERENCES public.flashcard_subjects(id) ON DELETE SET NULL,
    category VARCHAR(100), -- e.g., 'featured', 'popular', 'new', 'community', 'enem', 'medicina'
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
    total_cards INTEGER DEFAULT 0,
    estimated_time_minutes INTEGER,
    tags TEXT[],
    cover_image_url TEXT,
    author_name VARCHAR(255) DEFAULT 'Studify Team',
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE, -- All prebuilt decks are public
    download_count INTEGER DEFAULT 0, -- Or 'times_copied_to_user_decks'
    rating_average DECIMAL(3,2) DEFAULT 0.00 CHECK (rating_average >= 0 AND rating_average <= 5),
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.prebuilt_flashcard_decks IS 'Curated, pre-built flashcard decks.';
CREATE INDEX IF NOT EXISTS idx_prebuilt_decks_category ON public.prebuilt_flashcard_decks(category);
CREATE INDEX IF NOT EXISTS idx_prebuilt_decks_subject ON public.prebuilt_flashcard_decks(subject_id);

-- Pre-built Deck Flashcards Junction Table
CREATE TABLE IF NOT EXISTS public.prebuilt_deck_flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- Optional, composite key is also fine
    deck_id UUID NOT NULL REFERENCES public.prebuilt_flashcard_decks(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0, -- Order of the card in the prebuilt deck
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(deck_id, flashcard_id),
    UNIQUE(deck_id, order_index) -- Ensure unique order within a deck
);
COMMENT ON TABLE public.prebuilt_deck_flashcards IS 'Links flashcards to pre-built decks.';
CREATE INDEX IF NOT EXISTS idx_prebuilt_deck_flashcards_deck_id ON public.prebuilt_deck_flashcards(deck_id);


-- Content Library (Rich educational content snippets)
CREATE TABLE IF NOT EXISTS public.content_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('concept', 'formula', 'definition', 'example', 'theorem', 'diagram_info', 'historical_fact')),
    subject_id UUID REFERENCES public.flashcard_subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.flashcard_topics(id) ON DELETE SET NULL,
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
    keywords TEXT[],
    tags TEXT[],
    source VARCHAR(255),
    author VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.content_library IS 'Library of rich educational content snippets related to subjects/topics.';
CREATE INDEX IF NOT EXISTS idx_content_library_subject_topic ON public.content_library(subject_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_content_library_keywords ON public.content_library USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_content_library_tags ON public.content_library USING GIN(tags);

-- Deck Ratings (For prebuilt_flashcard_decks)
CREATE TABLE IF NOT EXISTS public.deck_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deck_id UUID NOT NULL REFERENCES public.prebuilt_flashcard_decks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(deck_id, user_id)
);
COMMENT ON TABLE public.deck_ratings IS 'User ratings and reviews for pre-built decks.';

-- User Deck Collections (Folders for users to organize their decks)
CREATE TABLE IF NOT EXISTS public.user_deck_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- If user wants to share their collection
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.user_deck_collections IS 'Allows users to group their custom decks into collections/folders.';

-- Collection Decks Junction Table (Links user_flashcard_decks to user_deck_collections)
CREATE TABLE IF NOT EXISTS public.collection_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES public.user_deck_collections(id) ON DELETE CASCADE,
    deck_id UUID NOT NULL REFERENCES public.user_flashcard_decks(id) ON DELETE CASCADE, -- Only user decks, not prebuilt
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, deck_id)
);
COMMENT ON TABLE public.collection_decks IS 'Links user-created decks to user-created collections.';


-- RLS Policies
ALTER TABLE public.flashcard_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public flashcard_subjects are viewable by everyone." ON public.flashcard_subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage flashcard_subjects." ON public.flashcard_subjects FOR ALL USING (true); -- TODO: Refine admin role

ALTER TABLE public.flashcard_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public flashcard_topics are viewable by everyone." ON public.flashcard_topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage flashcard_topics." ON public.flashcard_topics FOR ALL USING (true); -- TODO: Refine admin role

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public flashcards are viewable by everyone." ON public.flashcards FOR SELECT USING (true);
CREATE POLICY "Users can create flashcards if created_by is set." ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own flashcards." ON public.flashcards FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage flashcards." ON public.flashcards FOR ALL USING (true); -- TODO: Refine admin role

ALTER TABLE public.user_flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own decks." ON public.user_flashcard_decks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public user_flashcard_decks are viewable." ON public.user_flashcard_decks FOR SELECT USING (is_public = true);

ALTER TABLE public.deck_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage cards in their own decks." ON public.deck_flashcards FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_flashcard_decks WHERE id = deck_flashcards.deck_id AND user_id = auth.uid()));

ALTER TABLE public.user_flashcard_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own progress." ON public.user_flashcard_progress FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.flashcard_study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own study sessions." ON public.flashcard_study_sessions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own uploaded documents." ON public.uploaded_documents FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.prebuilt_flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public prebuilt_flashcard_decks are viewable by everyone." ON public.prebuilt_flashcard_decks FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can manage prebuilt_flashcard_decks." ON public.prebuilt_flashcard_decks FOR ALL USING (true); -- TODO: Refine admin role

ALTER TABLE public.prebuilt_deck_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public prebuilt_deck_flashcards are viewable." ON public.prebuilt_deck_flashcards FOR SELECT USING (true);
CREATE POLICY "Admins can manage prebuilt_deck_flashcards." ON public.prebuilt_deck_flashcards FOR ALL USING (true); -- TODO: Refine admin role

ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public content_library is viewable by everyone." ON public.content_library FOR SELECT USING (true);
CREATE POLICY "Admins can manage content_library." ON public.content_library FOR ALL USING (true); -- TODO: Refine admin role

ALTER TABLE public.deck_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own deck_ratings." ON public.deck_ratings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public deck_ratings are viewable." ON public.deck_ratings FOR SELECT USING (true); -- Or based on deck publicity

ALTER TABLE public.user_deck_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own deck collections." ON public.user_deck_collections FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.collection_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage decks in their own collections." ON public.collection_decks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_deck_collections WHERE id = collection_decks.collection_id AND user_id = auth.uid()));

SELECT '001-create-flashcard-schema.sql executed successfully.' AS status;
