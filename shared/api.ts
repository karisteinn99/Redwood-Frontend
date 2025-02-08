export const fetchTestMessage = async (): Promise<{
  message: string;
  status: string;
}> => {
  try {
    const response = await fetch('http://localhost:8000/homescreen/basic/');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return { message: 'Something went wrong', status: 'error' };
  }
};

// Function to fetch questions
export const getQuestions = async (): Promise<
  { id: number; question: string }[]
> => {
  try {
    const response = await fetch(
      'http://localhost:8000/game-session/api/questions/'
    );
    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    return []; // Return an empty array if an error occurs
  }
};

// Function to post an answer and calculate the distance
export const postAnswer = async (
  questionId: number,
  answer: { lat: number; long: number }
): Promise<{ distance_km: number } | { error: string }> => {
  try {
    const response = await fetch(
      'http://localhost:8000/game-session/api/answer/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: questionId,
          answer,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to post answer');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error posting answer:', error);
    return { error: 'Something went wrong' };
  }
};
