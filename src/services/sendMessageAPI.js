import axios from 'axios';
import { constants } from '../constants/contsants';

export const sendMessage = async (payload) => {
  const endPoint = 'chat/completions';
  try {
    const response = await axios.post(
      `${constants.BaseUrl}${endPoint}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${constants.OpenRouterAPI}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('Error in API call:', error);
    throw error;
  }
};
