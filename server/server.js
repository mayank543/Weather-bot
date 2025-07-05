const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// File paths for data storage
const CONFIG_FILE = path.join(__dirname, 'config.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const ADMINS_FILE = path.join(__dirname, 'admins.json');

// Initialize data files
const initializeFiles = async () => {
  try {
    // Initialize config file
    try {
      await fs.access(CONFIG_FILE);
    } catch {
      await fs.writeFile(CONFIG_FILE, JSON.stringify({
        apiKeys: {
          openai: '',
          telegram: '',
          discord: '',
          whatsapp: ''
        },
        botSettings: {
          maxTokens: 2000,
          temperature: 0.7,
          responseTimeout: 30000,
          rateLimitPerHour: 100
        }
      }, null, 2));
    }

    // Initialize users file
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
    }

    // Initialize admins file
    try {
      await fs.access(ADMINS_FILE);
    } catch {
      await fs.writeFile(ADMINS_FILE, JSON.stringify([
        // Add your admin email here
        "admin@example.com"
      ], null, 2));
    }
  } catch (error) {
    console.error('Error initializing files:', error);
  }
};

// Helper functions
const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
};

const writeJsonFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is admin
const verifyAdmin = async (req, res, next) => {
  try {
    const admins = await readJsonFile(ADMINS_FILE);
    if (!admins.includes(req.user.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verifying admin status' });
  }
};

// Routes

// Google OAuth login
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    
    // Check if user is admin
    const admins = await readJsonFile(ADMINS_FILE);
    if (!admins.includes(email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { email, name, picture },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token: jwtToken,
      user: { email, name, picture }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({ error: 'Invalid Google token' });
  }
});

// Get current user
app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Bot Settings Routes

// Get bot settings
app.get('/api/settings', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const config = await readJsonFile(CONFIG_FILE);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

// Update bot settings
app.put('/api/settings', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const config = await readJsonFile(CONFIG_FILE);
    const updatedConfig = { ...config, ...req.body };
    
    const success = await writeJsonFile(CONFIG_FILE, updatedConfig);
    if (success) {
      res.json({ message: 'Settings updated successfully' });
    } else {
      res.status(500).json({ error: 'Error updating settings' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error updating settings' });
  }
});

// User Management Routes

// Get all users
app.get('/api/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await readJsonFile(USERS_FILE);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Add user
app.post('/api/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await readJsonFile(USERS_FILE);
    const newUser = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    users.push(newUser);
    const success = await writeJsonFile(USERS_FILE, users);
    
    if (success) {
      res.json({ message: 'User added successfully', user: newUser });
    } else {
      res.status(500).json({ error: 'Error adding user' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error adding user' });
  }
});

// Update user
app.put('/api/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await readJsonFile(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users[userIndex] = { ...users[userIndex], ...req.body };
    const success = await writeJsonFile(USERS_FILE, users);
    
    if (success) {
      res.json({ message: 'User updated successfully', user: users[userIndex] });
    } else {
      res.status(500).json({ error: 'Error updating user' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Delete user
app.delete('/api/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await readJsonFile(USERS_FILE);
    const filteredUsers = users.filter(u => u.id !== req.params.id);
    
    if (filteredUsers.length === users.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const success = await writeJsonFile(USERS_FILE, filteredUsers);
    
    if (success) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(500).json({ error: 'Error deleting user' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Block/Unblock user
app.put('/api/users/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const users = await readJsonFile(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users[userIndex].status = status;
    const success = await writeJsonFile(USERS_FILE, users);
    
    if (success) {
      res.json({ message: `User ${status} successfully`, user: users[userIndex] });
    } else {
      res.status(500).json({ error: 'Error updating user status' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error updating user status' });
  }
});

// Stats route
app.get('/api/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await readJsonFile(USERS_FILE);
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      blockedUsers: users.filter(u => u.status === 'blocked').length,
      recentUsers: users.filter(u => {
        const createdAt = new Date(u.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      }).length
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// Initialize files and start server
initializeFiles().then(() => {
  app.listen(PORT, () => {
    console.log(`Admin panel server running on port ${PORT}`);
  });
});