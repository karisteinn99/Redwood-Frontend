import {
  BulkQuestionsRequest,
  BulkQuestionsResponse,
  CreateGameSessionRequest,
  CreateQuestionRequest,
  GameSession,
  GetGameSessionParams,
  GetQuestionsParams,
  HealthCheckResponse,
  LeaderboardEntry,
  Question,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  UpdateGameSessionRequest,
} from './data-contracts';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ===== Health Check =====

  async getHealth(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>('/health');
  }

  // ===== Questions =====

  async getQuestions(params?: GetQuestionsParams): Promise<Question[]> {
    const queryParams = new URLSearchParams();

    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const endpoint = queryParams.toString()
      ? `/questions?${queryParams.toString()}`
      : '/questions';

    return this.request<Question[]>(endpoint);
  }

  async createQuestion(data: CreateQuestionRequest): Promise<Question> {
    return this.request<Question>('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postBulkQuestions(
    data: BulkQuestionsRequest
  ): Promise<BulkQuestionsResponse> {
    return this.request<BulkQuestionsResponse>('/admin/bulk-questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== Game Sessions =====

  async getGameSession(
    params?: GetGameSessionParams
  ): Promise<GameSession | LeaderboardEntry[]> {
    const queryParams = new URLSearchParams();

    if (params?.id) {
      queryParams.append('id', params.id);
    }

    if (params?.leaderboard) {
      queryParams.append('leaderboard', 'true');
    }

    const endpoint = queryParams.toString()
      ? `/game-sessions?${queryParams.toString()}`
      : '/game-sessions';

    return this.request<GameSession | LeaderboardEntry[]>(endpoint);
  }

  async getGameSessionById(id: string): Promise<GameSession> {
    return this.request<GameSession>(`/game-sessions?id=${id}`);
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.request<LeaderboardEntry[]>('/game-sessions?leaderboard=true');
  }

  async createGameSession(
    data?: CreateGameSessionRequest
  ): Promise<GameSession> {
    return this.request<GameSession>('/game-sessions', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async updateGameSession(
    data: UpdateGameSessionRequest
  ): Promise<GameSession> {
    return this.request<GameSession>('/game-sessions', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async completeGameSession(sessionId: number): Promise<GameSession> {
    return this.updateGameSession({ sessionId, isCompleted: true });
  }

  // ===== Answers =====

  async submitAnswer(data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    return this.request<SubmitAnswerResponse>('/answers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Create and export a singleton instance
export const api = new ApiClient();

// Also export the class for custom instances if needed
export { ApiClient };

// ===== Legacy API functions for backward compatibility =====
// These can be removed once you've migrated all existing code to use the new api object

export const fetchTestMessage = async (): Promise<{
  message: string;
  status: string;
}> => {
  try {
    const healthData = await api.getHealth();
    return {
      message:
        healthData.status === 'healthy'
          ? 'Database connected successfully!'
          : 'Database disconnected',
      status: healthData.status,
    };
  } catch (error) {
    console.error('Error fetching health data:', error);
    return { message: 'Something went wrong', status: 'error' };
  }
};

export const getQuestions = async (): Promise<
  { id: number; question: string }[]
> => {
  try {
    return await api.getQuestions();
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
};

export const postAnswer = async (
  questionId: number,
  answer: { lat: number; long: number }
): Promise<{ distance_km: number } | { error: string }> => {
  try {
    const result = await api.submitAnswer({
      questionId,
      answer: {
        lat: answer.lat,
        lng: answer.long, // Convert 'long' to 'lng' for consistency
      },
    });
    return { distance_km: result.distance_km };
  } catch (error) {
    console.error('Error posting answer:', error);
    return { error: 'Something went wrong' };
  }
};
