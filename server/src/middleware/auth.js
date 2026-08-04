const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// This uses Clerk's official middleware to verify the JWT
const clerkAuth = ClerkExpressRequireAuth({
  // Optional: handle unauthorized requests manually
});

// We wrap it to adapt Clerk's 'req.auth.userId' to our app's expected 'req.user.id'
// This ensures we don't have to rewrite all our other backend routes!
const auth = (req, res, next) => {
  clerkAuth(req, res, (err) => {
    if (err) {
      console.error("Clerk Auth Error:", err);
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    
    // Clerk sets req.auth.userId
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: 'Invalid token structure' });
    }

    // Attach to req.user for backward compatibility with our existing routes
    req.user = {
      id: req.auth.userId
    };

    next();
  });
};

module.exports = auth;
