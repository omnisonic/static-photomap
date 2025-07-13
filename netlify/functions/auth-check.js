exports.handler = async (event, context) => {
  // Check if user is authenticated via Netlify Identity
  const { user } = context.clientContext || {};
  
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authentication required' })
    };
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      authenticated: true,
      user: {
        id: user.sub,
        email: user.email
      }
    })
  };
};
