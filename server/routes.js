const express = require('express');
const router = express.Router();
const multer = require('multer');
const { dbUtils } = require('./db');
const { processAgentChat, estimateNutrition } = require('./agent');

const upload = multer({ storage: multer.memoryStorage() });

// Helper to get today's date in YYYY-MM-DD
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// 1. User Onboarding / Setup
router.post('/onboarding', async (req, res) => {
  try {
    const { name, age, gender, height, weight, wake_time, bed_time, goals, notifications } = req.body;
    
    // Check if user exists
    const user = await dbUtils.get("SELECT * FROM users LIMIT 1");
    
    const goalsStr = Array.isArray(goals) ? goals.join(',') : goals || '';
    const notificationsStr = typeof notifications === 'object' ? JSON.stringify(notifications) : notifications || '';

    let userId;
    if (user) {
      // Update
      await dbUtils.run(`
        UPDATE users 
        SET name = ?, age = ?, gender = ?, height = ?, weight = ?, 
            wake_time = ?, bed_time = ?, goals = ?, notifications = ?
        WHERE id = ?
      `, [name, age, gender, height, weight, wake_time, bed_time, goalsStr, notificationsStr, user.id]);
      userId = user.id;
      console.log('User profile updated.');
    } else {
      // Insert
      const result = await dbUtils.run(`
        INSERT INTO users (name, age, gender, height, weight, wake_time, bed_time, goals, notifications)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [name, age, gender, height, weight, wake_time, bed_time, goalsStr, notificationsStr]);
      userId = result.id;
      console.log('User profile created.');
    }

    res.json({ success: true, message: 'Onboarding completed successfully', userId });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Fetch User Info
router.get('/user', async (req, res) => {
  try {
    const user = await dbUtils.get("SELECT * FROM users LIMIT 1");
    if (!user) {
      return res.json({ success: false, message: 'User not onboarding yet' });
    }
    // Parse fields
    user.goals = user.goals ? user.goals.split(',') : [];
    try {
      user.notifications = user.notifications ? JSON.parse(user.notifications) : {};
    } catch (e) {
      user.notifications = {};
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Home Dashboard Metrics
router.get('/dashboard', async (req, res) => {
  try {
    const today = getTodayDate();
    const user = await dbUtils.get("SELECT * FROM users LIMIT 1");
    
    // Fallback default values
    const name = user ? user.name : 'Health Companion';
    const goals = user ? (user.goals ? user.goals.split(',') : []) : [];
    
    // a. Today's Hydration
    const hydrationLog = await dbUtils.get(
      "SELECT SUM(amount) as total FROM hydration_logs WHERE date = ?",
      [today]
    );
    const waterIntake = hydrationLog ? (hydrationLog.total || 0) : 0;
    const waterGoal = 2500; // default 2500ml

    // b. Sleep Log
    const sleepLog = await dbUtils.get(
      "SELECT duration, quality FROM sleep_logs WHERE date = ? ORDER BY id DESC LIMIT 1",
      [today]
    );
    const sleepDuration = sleepLog ? sleepLog.duration : 0;
    const sleepQuality = sleepLog ? sleepLog.quality : 0;
    
    // Weekly sleep average
    const weeklySleep = await dbUtils.get(
      "SELECT AVG(duration) as avg_sleep FROM sleep_logs WHERE date >= date('now', '-7 days')"
    );
    const avgSleep = weeklySleep ? parseFloat((weeklySleep.avg_sleep || 0).toFixed(1)) : 0;

    // c. Habits Status
    const habitsList = await dbUtils.all("SELECT * FROM habits WHERE active = 1");
    const habitLogs = await dbUtils.all("SELECT habit_id FROM habit_logs WHERE date = ? AND completed = 1", [today]);
    const completedHabitIds = new Set(habitLogs.map(l => l.habit_id));
    
    const habits = habitsList.map(h => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      completed: completedHabitIds.has(h.id)
    }));

    const totalHabits = habits.length;
    const completedHabitsCount = habits.filter(h => h.completed).length;
    const habitProgress = totalHabits > 0 ? Math.round((completedHabitsCount / totalHabits) * 100) : 0;

    // d. Nutrition Log
    const meals = await dbUtils.all("SELECT * FROM meals WHERE date = ?", [today]);
    const nutritionSummary = meals.reduce((acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.protein += meal.protein || 0;
      acc.carbs += meal.carbs || 0;
      acc.fat += meal.fat || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    nutritionSummary.protein = Math.round(nutritionSummary.protein);
    nutritionSummary.carbs = Math.round(nutritionSummary.carbs);
    nutritionSummary.fat = Math.round(nutritionSummary.fat);

    // e. Streaks calculation (simplified streak helper)
    // For simplicity, returns a static/computed streak based on habit completions
    let streakCount = 0;
    const streakResult = await dbUtils.get(
      "SELECT COUNT(DISTINCT date) as active_days FROM habit_logs WHERE date >= date('now', '-30 days')"
    );
    if (streakResult) {
      streakCount = streakResult.active_days || 0;
    }

    // f. AI/Dynamic Insight Generation
    let dailyInsight = "Welcome to Aurora! Start your day by logging your bedtime and tracking water intake.";
    if (waterIntake === 0 && completedHabitsCount === 0) {
      dailyInsight = `Morning, ${name}! Stay ahead of your energy levels today. Start with a glass of water.`;
    } else if (waterIntake > 0 && waterIntake < 1000) {
      dailyInsight = "Good start on hydration. Let's keep it up to maintain focus and clear skin!";
    } else if (sleepDuration > 0 && sleepDuration < 6) {
      dailyInsight = `You slept only ${sleepDuration} hours last night. Take it easy today and prioritize early bedtime.`;
    } else if (completedHabitsCount > 0 && completedHabitsCount === totalHabits) {
      dailyInsight = "Amazing! You completed all your habits for today. Consistent routines create lifelong success!";
    } else if (waterIntake >= waterGoal) {
      dailyInsight = "Hydration goal reached! Excellent commitment to your health today.";
    }

    // Fetch memory snippets to add context
    const memory = await dbUtils.all("SELECT note FROM health_memory ORDER BY id DESC LIMIT 2");
    const memoryNotes = memory.map(m => m.note);

    res.json({
      success: true,
      dashboard: {
        name,
        goals,
        waterIntake,
        waterGoal,
        sleepDuration,
        sleepQuality,
        avgSleep,
        habits,
        habitProgress,
        nutrition: {
          mealsLoggedCount: meals.length,
          summary: nutritionSummary,
          meals
        },
        streaks: {
          activeStreak: streakCount > 0 ? streakCount : 1,
          longestStreak: streakCount > 5 ? streakCount : 5
        },
        dailyInsight,
        memoryNotes
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Voice & Chat Agent
router.post('/chat', upload.single('audio'), async (req, res) => {
  try {
    const { messageText } = req.body;
    let audioBase64 = null;
    let audioMime = null;

    if (req.file) {
      audioBase64 = req.file.buffer.toString('base64');
      audioMime = req.file.mimetype; // e.g. audio/m4a, audio/wav, etc.
      console.log(`Received audio chat upload, size: ${req.file.buffer.length} bytes, type: ${audioMime}`);
    } else {
      console.log(`Received text chat message: "${messageText}"`);
    }

    const agentResponse = await processAgentChat(messageText, audioBase64, audioMime);
    res.json({ success: true, response: agentResponse });
  } catch (error) {
    console.error('Chat routing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Hydration API
router.post('/water', async (req, res) => {
  try {
    const { amount, date } = req.body;
    const logDate = date || getTodayDate();
    const result = await dbUtils.run(
      "INSERT INTO hydration_logs (date, amount) VALUES (?, ?)",
      [logDate, amount]
    );
    res.json({ success: true, id: result.id, message: `Logged ${amount}ml of water.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/water/history', async (req, res) => {
  try {
    const history = await dbUtils.all(
      "SELECT date, SUM(amount) as amount FROM hydration_logs GROUP BY date ORDER BY date DESC LIMIT 7"
    );
    res.json({ success: true, history: history.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Sleep API
router.post('/sleep', async (req, res) => {
  try {
    const { duration, quality, date } = req.body;
    const logDate = date || getTodayDate();
    const result = await dbUtils.run(
      "INSERT INTO sleep_logs (date, duration, quality) VALUES (?, ?, ?)",
      [logDate, duration, quality || 3]
    );
    res.json({ success: true, id: result.id, message: `Logged ${duration}h of sleep.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sleep/history', async (req, res) => {
  try {
    const history = await dbUtils.all(
      "SELECT date, duration, quality FROM sleep_logs ORDER BY date DESC LIMIT 7"
    );
    res.json({ success: true, history: history.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Habits API
router.post('/habit', async (req, res) => {
  try {
    const { name, icon } = req.body;
    const result = await dbUtils.run(
      "INSERT INTO habits (name, icon) VALUES (?, ?)",
      [name, icon || 'check']
    );
    res.json({ success: true, id: result.id, name, icon });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/habit/toggle', async (req, res) => {
  try {
    const { habitId } = req.body;
    const today = getTodayDate();
    
    // Check if completed
    const existing = await dbUtils.get(
      "SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?",
      [habitId, today]
    );

    if (existing) {
      // Uncheck it
      await dbUtils.run("DELETE FROM habit_logs WHERE id = ?", [existing.id]);
      res.json({ success: true, completed: false, message: 'Habit uncompleted.' });
    } else {
      // Complete it
      await dbUtils.run("INSERT INTO habit_logs (habit_id, date, completed) VALUES (?, ?, 1)", [habitId, today]);
      res.json({ success: true, completed: true, message: 'Habit completed.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Nutrition API
router.post('/meals', async (req, res) => {
  try {
    const { meal_type, description, calories, protein, carbs, fat, date } = req.body;
    const logDate = date || getTodayDate();

    let macros = { calories, protein, carbs, fat };
    
    // Call Gemini to estimate if macros are not explicitly provided
    if ((!calories || calories === 0) && description) {
      console.log(`Estimating macros for: "${description}"`);
      const estimate = await estimateNutrition(description);
      macros = {
        calories: estimate.calories,
        protein: estimate.protein,
        carbs: estimate.carbs,
        fat: estimate.fat
      };
    }

    const result = await dbUtils.run(`
      INSERT INTO meals (date, meal_type, description, calories, protein, carbs, fat)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [logDate, meal_type, description, macros.calories || 0, macros.protein || 0, macros.carbs || 0, macros.fat || 0]);

    res.json({
      success: true,
      meal: {
        id: result.id,
        date: logDate,
        meal_type,
        description,
        ...macros
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/meals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbUtils.run("DELETE FROM meals WHERE id = ?", [id]);
    res.json({ success: true, message: 'Meal deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
