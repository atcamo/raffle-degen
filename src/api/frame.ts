export async function POST() {
  // Por ahora, solo redirigimos a la aplicación principal
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/'
    }
  });
} 