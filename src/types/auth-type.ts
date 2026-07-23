export type LoginPayload = {
  whatsapp_number: string;
  password: string;
};

export type CustomerUser = {
  id: string;
  full_name?: string;
  fullName?: string;
  name?: string;
  email: string;
  whatsapp_number?: string;
  whatsappNumber?: string;
};

export type LoginResponse = {
  message: string;
  data: {
    token: string;
    token_type?: string;
    customer?: CustomerUser;
    user?: CustomerUser;
  };
};
