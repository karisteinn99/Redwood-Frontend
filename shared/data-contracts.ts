// ===== Base Types =====

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}

export interface Location {
  lat: number;
  lng: number;
}

// ===== Question Types =====

export interface Question {
  id: number;
  question: string;
  correctLat?: number;
  correctLng?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

export interface CreateQuestionRequest {
  question: string;
  correctLat: number;
  correctLng: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

export interface BulkQuestionsRequest {
  questionsData: CreateQuestionRequest[];
}

export interface BulkQuestionsResponse {
  message: string;
  questions: Question[];
}

// ===== Game Session Types =====

export interface GameSession {
  id: number;
  playerName: string;
  totalScore: number | null;
  questionsAnswered: number | null;
  isCompleted: boolean;
  createdAt: Date;
  completedAt: Date | null;
}

export interface CreateGameSessionRequest {
  playerName?: string;
}

export interface UpdateGameSessionRequest {
  sessionId: number;
  isCompleted?: boolean;
}

export interface LeaderboardEntry {
  playerName: string;
  totalScore: number;
  questionsAnswered: number;
  completedAt: Date;
}

// ===== Answer Types =====

export interface Answer {
  id: number;
  sessionId: number;
  questionId: number;
  answerLat: number;
  answerLng: number;
  distanceKm: number;
  submittedAt: Date;
}

export interface SubmitAnswerRequest {
  questionId: number;
  answer: Location;
  sessionId?: number;
}

export interface SubmitAnswerResponse {
  distance_km: number;
  correct_location: Location;
}

// ===== Health Check Types =====

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: 'connected' | 'disconnected';
  error?: string;
  environment: {
    hasDbUrl: boolean;
    nodeEnv?: string;
  };
}

// ===== Query Parameters =====

export interface GetQuestionsParams {
  limit?: number;
}

export interface GetGameSessionParams {
  id?: string;
  leaderboard?: boolean;
}
