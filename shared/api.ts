// utils/api.ts

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
