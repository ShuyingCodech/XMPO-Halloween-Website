// Function to check if current time is still in early bird period
export const checkEarlyBirdStatus = (): boolean => {
  // Create date for 18th Sep 2025, 00:00 Malaysia Time (UTC+8)
  const earlyBirdEndDate = new Date("2025-09-18T00:00:00+08:00");
  const now = new Date();

  return now < earlyBirdEndDate;
};
