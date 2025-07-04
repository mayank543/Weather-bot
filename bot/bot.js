import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Debug: Check if environment variables are loaded
// console.log('🔍 Environment variables check:');
// console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing');
// console.log('WEATHER_API_KEY:', process.env.WEATHER_API_KEY ? '✅ Set' : '❌ Missing');
// console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// Schema for users
const userSchema = new mongoose.Schema({
  chatId: String,
  city: String,
  subscribed: Boolean,
});

const User = mongoose.model('User', userSchema);

// Utility to get weather
async function getWeather(city) {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    
    // Debug: Log the API call
    console.log(`🌤️ Fetching weather for: ${city}`);
    console.log(`🔑 Using API Key: ${apiKey.substring(0, 8)}...`);
    
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    console.log(`📡 API URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    const res = await axios.get(url);
    const data = res.data;
    
    return `🌤️ Weather in *${data.name}*:\nTemp: ${data.main.temp}°C\nHumidity: ${data.main.humidity}%\nCondition: ${data.weather[0].description}`;
  } catch (error) {
    console.error('❌ Weather API Error:', error.response?.data || error.message);
    
    // More specific error messages
    if (error.response?.status === 401) {
      return `❌ Invalid API key. Please check your OpenWeatherMap API key.`;
    } else if (error.response?.status === 404) {
      return `❌ City "${city}" not found. Please check the spelling.`;
    } else if (error.response?.status === 429) {
      return `❌ Too many requests. Please try again later.`;
    }
    
    return `❌ Could not fetch weather for "${city}". Error: ${error.response?.data?.message || error.message}`;
  }
}

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('❌ Polling Error:', error);
});

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  console.log(`👋 /start command from chat ID: ${chatId}`);
  
  try {
    await bot.sendMessage(chatId, `👋 Hello ${msg.chat.first_name}! Use /subscribe to get daily weather updates.`);
  } catch (error) {
    console.error('❌ Error sending start message:', error);
  }
});

// /subscribe command
bot.onText(/\/subscribe/, async (msg) => {
  const chatId = msg.chat.id;
  console.log(`📍 /subscribe command from chat ID: ${chatId}`);
  
  try {
    await bot.sendMessage(chatId, '📍 Please send your city name:');
    
    // Set up a one-time listener for the next message from this chat
    const cityListener = async (cityMsg) => {
      // Make sure this is from the same chat and not a command
      if (cityMsg.chat.id !== chatId || cityMsg.text.startsWith('/')) {
        return;
      }
      
      // Remove the listener to prevent memory leaks
      bot.removeListener('message', cityListener);
      
      const city = cityMsg.text.trim();
      console.log(`🏙️ User ${chatId} wants weather for: ${city}`);
      
      try {
        const weatherText = await getWeather(city);
        
        await User.findOneAndUpdate(
          { chatId: chatId.toString() },
          { chatId: chatId.toString(), city, subscribed: true },
          { upsert: true }
        );
        
        await bot.sendMessage(chatId, `✅ Subscribed to daily weather updates for "${city}".\n\n${weatherText}`, {
          parse_mode: 'Markdown',
        });
      } catch (error) {
        console.error('❌ Error in subscription process:', error);
        await bot.sendMessage(chatId, '❌ Something went wrong. Please try again.');
      }
    };
    
    bot.on('message', cityListener);
    
    // Set a timeout to remove the listener after 2 minutes
    setTimeout(() => {
      bot.removeListener('message', cityListener);
    }, 120000);
    
  } catch (error) {
    console.error('❌ Error in subscribe command:', error);
  }
});

// /weather command
bot.onText(/\/weather/, async (msg) => {
  const chatId = msg.chat.id;
  console.log(`🌤️ /weather command from chat ID: ${chatId}`);
  
  try {
    const user = await User.findOne({ chatId: chatId.toString() });
    
    if (!user || !user.city) {
      return bot.sendMessage(chatId, '❌ You are not subscribed yet. Use /subscribe first.');
    }
    
    const weather = await getWeather(user.city);
    await bot.sendMessage(chatId, weather, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('❌ Error in weather command:', error);
    await bot.sendMessage(chatId, '❌ Something went wrong. Please try again.');
  }
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const helpText = `
🤖 *Weather Bot Commands:*

/start - Start the bot
/subscribe - Subscribe to daily weather updates
/weather - Get current weather for your subscribed city
/help - Show this help message

Just send me a city name after using /subscribe to get started!
  `;
  
  try {
    await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('❌ Error sending help message:', error);
  }
});

console.log('🚀 Bot is running...');