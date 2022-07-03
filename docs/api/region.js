export default function handler(request, response) {
  const { headers } = request;

  response.setHeader("Access-Control-Allow-Origin", "*");
  response.status(200).json({
    ip: headers["x-real-ip"],
    ipCity: headers["x-vercel-ip-city"],
    ipCountry: headers["x-vercel-ip-country"],
    ipRegion: headers["x-vercel-ip-country-region"],
  });
}
