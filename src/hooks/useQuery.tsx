import { useQueryClient } from "@tanstack/react-query";

export const useInvalidateBookingQueries = () => {
  const queryClient = useQueryClient();
  const keysToInvalidate = ["rooms", "book", "reserve", "payments"];

  const invalidate = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return keysToInvalidate.includes(key as string);
      },
    });
  };

  return invalidate;
};
