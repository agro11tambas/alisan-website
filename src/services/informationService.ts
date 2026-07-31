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

let cachedInformation: Information | undefined;
let informationRequest: Promise<Information | null> | null = null;

export const informationService = {
  getInformation: async (): Promise<Information | null> => {
    if (cachedInformation) {
      return cachedInformation;
    }

    if (informationRequest) {
      return informationRequest;
    }

    informationRequest = (async () => {
      try {
        const information = await fetchInformation();

        if (information) {
          cachedInformation = information;
        }

        return information;
      } finally {
        informationRequest = null;
      }
    })();

    return informationRequest;
  },
};
