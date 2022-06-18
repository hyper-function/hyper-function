export default function handler(request, response) {
  response.status(200).json({
    headers: request.headers,
    query: request.query,
    cookies: request.cookies,
  });
}
