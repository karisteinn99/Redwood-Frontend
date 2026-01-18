# 🌍 Redwood Geography Game

A GeoGuesser-inspired location guessing game built with Next.js, featuring interactive maps and challenging geography questions.

![Game Preview](https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?q=80&w=400&h=200&auto=format&fit=crop)

## 🎯 Project Vision

Create an engaging geography game where players answer location-based questions and guess coordinates on a world map. Think GeoGuesser meets trivia - players read a question about a location and click on the map where they think it is.

## 🚀 Current Status

### ✅ What's Already Built

- **📁 Project Structure**: Next.js 16 with TypeScript and Tailwind CSS
- **🗃️ Database**: PostgreSQL with Drizzle ORM
  - Questions table (geography questions with coordinates)
  - Game sessions tracking
  - Answers with distance calculations
  - Admin users for question management
- **🗺️ Interactive Map**: Leaflet-based world map with click handling
- **📱 UI Components**:
  - Menu page with game title and navigation
  - Map component with click-to-guess functionality
  - Button components and basic styling
- **🔌 API Endpoints**:
  - `/api/questions` - Fetch random questions
  - `/api/answers` - Submit player answers
  - `/api/game-sessions` - Session management
  - `/api/admin` - Admin question management
- **🎨 Styling**: Earth-themed design with space background

### 🚧 What Needs to Be Done

## 📋 Development Roadmap

### Phase 1: Core Game Flow 🎮

**Priority: HIGH** - Make the game actually playable end-to-end

1. **Game Session Management**

   - [ ] Implement proper game session creation on game start
   - [ ] Track player progress through questions
   - [ ] Calculate and display running score
   - [ ] Handle game completion and final results

2. **Question Display System**

   - [ ] Create question display component
   - [ ] Show current question text prominently
   - [ ] Add question counter (e.g., "Question 2 of 5")
   - [ ] Implement question navigation logic

3. **Answer Feedback**

   - [ ] Show distance from correct answer after each guess
   - [ ] Display correct location on map
   - [ ] Add visual feedback (success/error indicators)
   - [ ] Score calculation and display

4. **Game Results**
   - [ ] Create end-game results screen
   - [ ] Show total score and individual question performance
   - [ ] Add "Play Again" functionality

### Phase 2: Enhanced User Experience 🎨

**Priority: MEDIUM** - Polish the core experience

5. **User Interface Improvements**

   - [ ] Add loading states for map and questions
   - [ ] Implement better error handling and user feedback
   - [ ] Create responsive design for mobile devices
   - [ ] Add animations and transitions

6. **Map Enhancements**

   - [ ] Add markers for guessed vs correct locations
   - [ ] Zoom controls and better map interaction
   - [ ] Different map styles/themes
   - [ ] Distance visualization (lines between guess and answer)

7. **Scoring System**
   - [ ] Implement different scoring algorithms
   - [ ] Add difficulty-based scoring
   - [ ] Time-based scoring bonuses
   - [ ] Achievement system

### Phase 3: Content Management 📚

**Priority: MEDIUM** - Make it easy to add content

8. **Question Management**

   - [ ] Build admin interface for adding questions
   - [ ] Question categories and difficulty levels
   - [ ] Bulk question import functionality
   - [ ] Question validation and testing tools

9. **Database Seeding**
   - [ ] Create comprehensive question dataset
   - [ ] Categorize questions by difficulty and region
   - [ ] Add question metadata (hints, explanations)

### Phase 4: Social Features 👥

**Priority: LOW** - Add multiplayer and social elements

10. **Leaderboards**

    - [ ] Implement global leaderboards
    - [ ] Daily/weekly challenges
    - [ ] Player profiles and statistics
    - [ ] Social sharing features

11. **Multiplayer**
    - [ ] Real-time multiplayer matches
    - [ ] Challenge friends functionality
    - [ ] Room-based game sessions

### Phase 5: Advanced Features ⚡

**Priority: LOW** - Nice-to-have enhancements

12. **Game Modes**

    - [ ] Timed challenges
    - [ ] Survival mode (unlimited questions)
    - [ ] Region-specific games
    - [ ] Custom difficulty settings

13. **Analytics & Insights**
    - [ ] Player performance analytics
    - [ ] Question difficulty analysis
    - [ ] Usage statistics dashboard

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (Vercel Postgres or Neon)
- Basic knowledge of Next.js and React

### Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Generate database schema
pnpm db:generate
pnpm db:migrate

# Seed database with sample questions
pnpm db:seed

# Start development server
pnpm dev
```

## 📁 Project Structure

```
app/
├── page.tsx              # Landing page with earth background
├── layout.tsx            # Root layout
├── components/           # Reusable UI components
│   ├── menu-page.tsx     # Main menu
│   ├── button.tsx        # Button component
│   └── map-animated.tsx  # Animated map component
├── game-session/         # Game page
│   ├── page.tsx          # Game session wrapper
│   └── world-map.tsx     # Interactive map component
├── leaderboards/         # Leaderboard page
└── api/                  # API routes
    ├── questions/        # Question endpoints
    ├── answers/          # Answer submission
    ├── game-sessions/    # Session management
    └── admin/            # Admin endpoints

db/
├── schema.ts             # Database schema
├── index.ts              # Database connection
└── seed.ts               # Database seeding

shared/
├── api.ts                # API client
└── data-contracts.ts     # TypeScript interfaces
```

## 🎮 Game Flow Design

1. **Start Game**: Player clicks "Play Game" from menu
2. **Session Creation**: Create new game session in database
3. **Question Display**: Show first geography question
4. **Map Interaction**: Player clicks on map to guess location
5. **Answer Processing**: Calculate distance and score
6. **Feedback**: Show result and correct location
7. **Next Question**: Continue until all questions answered
8. **Results**: Display final score and statistics
9. **Leaderboard**: Save high score (optional)

## 🎨 Design Inspiration

Taking inspiration from GeoGuesser's clean interface:

- **Earth theme**: Space/satellite imagery backgrounds
- **Clean typography**: Bold titles, readable question text
- **Interactive map**: Smooth clicking and zooming
- **Color scheme**: Earth tones with blue accents
- **Feedback**: Clear success/error states

## 🚀 Feature Ideas & Enhancements

### Short-term Wins

- **Question hints**: Add optional hints for difficult questions
- **Better mobile UX**: Optimize map interaction for touch devices
- **Sound effects**: Audio feedback for correct/incorrect answers
- **Progress indicators**: Visual progress through question set

### Medium-term Goals

- **Photo integration**: Add location photos as question clues
- **Street View**: Integration with Street View API for immersive questions
- **Custom maps**: Region-specific maps (Europe, Asia, etc.)
- **Themed quizzes**: Historical events, landmarks, capitals, etc.

### Long-term Vision

- **AR integration**: Use device camera for real-world location games
- **Educational partnerships**: Content for schools and geography classes
- **User-generated content**: Let players submit their own questions
- **Competitive leagues**: Seasonal tournaments and championships

## 🔧 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, custom CSS variables
- **Maps**: Leaflet with React-Leaflet
- **Database**: PostgreSQL with Drizzle ORM
- **Hosting**: Vercel (frontend) + Vercel Postgres
- **Animations**: Lottie React

## 📈 Getting Back Into Development

When you return to this project:

1. **Check this README** for current status and next priorities
2. **Run the app locally** (`pnpm dev`) to see current state
3. **Look at the roadmap** and pick a Phase 1 item to work on
4. **Check the database** (`pnpm db:studio`) to see what data exists
5. **Test the current game flow** to identify immediate issues

## 🎯 Immediate Next Steps

The most important items to work on next (in order):

1. **Fix the game flow**: Make sure questions display properly and game sessions work
2. **Add question display**: Players need to see what they're guessing
3. **Implement answer feedback**: Show how close/far they were
4. **Create end-game screen**: Show final results and score

---

**Happy Coding! 🌍**

_Remember: This is a hobby project, so focus on making it fun first, perfect second!_
