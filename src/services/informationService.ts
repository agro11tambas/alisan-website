import { api } from "./api";

export interface Information {
  id: number;
  phone_number: string;
}

const fetchInformation = async (): Promise<Information | null> => {
  try {
    const response = await api.get("/ecommerce/information");
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching information:", error);
    return null;
  }
};

export const informationService = {
  getInformation: async (): Promise<Information | null> => {
    return fetchInformation();
  },
};
