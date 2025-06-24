export const successResponse = (data = {}) => {
  return {
    success: true,
    ...data,
  };
};

export const errorResponse = (
  errorMessage = "Unknown error",
  errorCode = null
) => {
  return {
    success: false,
    error: errorMessage,
    code: errorCode,
  };
};
