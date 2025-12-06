import axios from "axios";

export const getUserGeoLocationDetails = async () => {
  try {
    const response = await axios.get(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.NEXT_PUBLIC_GEO_LOCATION_DETECTION_API_KEY}`
    );

    // console.log("User's geolocation details:", response.data);
    if (response.data) {
      return {
        status: true,
        data: response.data,
      };
    } else {
      return {
        status: false,
        message: "No data found",
      };
    }
  } catch (error) {
    // console.error("Error fetching user's geolocation details:", error);
    return {
      status: false,
      message: `Error fetching user's geolocation details: ${error}`,
    };
  }
};
