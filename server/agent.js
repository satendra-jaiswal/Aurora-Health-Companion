const { GoogleGenerativeAI } = require('@google/generative-ai');
const { dbUtils } = require('./db');

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Helper to get today's date in YYYY-MM-DD
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Tool Declarations for Gemini Function Calling
const tools = [
  {
    functionDeclarations: [
      {
        name: 'logWater',
        description: 'Logs water intake in milliliters (ml) for the user.',
        parameters: {
          type: 'OBJECT',
          properties: {
            amount: {
              type: 'INTEGER',
              description: 'The amount of water in ml, e.g., 250, 500, 750.'
            }
          },
          required: ['amount']
        }
      },
      {
        name: 'logSleep',
        description: 'Logs sleep duration in hours and optional quality for the previous night.',
        parameters: {
          type: 'OBJECT',
          properties: {
            duration: {
              type: 'NUMBER',
              description: 'Duration of sleep in hours, e.g., 7.5, 8.0.'
            },
            quality: {
              type: 'INTEGER',
              description: 'Sleep quality score from 1 (terrible) to 5 (excellent).'
            }
          },
          required: ['duration']
        }
      },
      {
        name: 'createHabit',
        description: 'Creates a new habit to track.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: {
              type: 'STRING',
              description: 'Name of the habit, e.g., Read a Book, Exercise, Meditate.'
            },
            icon: {
              type: 'STRING',
              description: 'Icon name representing the habit, e.g., book, accessibility, wind, droplet, moon, smile.'
            }
          },
          required: ['name']
        }
      },
      {
        name: 'completeHabit',
        description: 'Marks a habit as completed for today.',
        parameters: {
          type: 'OBJECT',
          properties: {
            habitName: {
              type: 'STRING',
              description: 'The exact or partial name of the habit to complete, e.g., Drink Water, Meditate.'
            }
          },
          required: ['habitName']
        }
      },
      {
        name: 'saveHealthMemory',
        description: 'Saves a behavioral note or pattern about the user to the long-term health memory (e.g. sleeps better on weekends).',
        parameters: {
          type: 'OBJECT',
          properties: {
            note: {
              type: 'STRING',
              description: 'The pattern or behavior note, e.g., User drinks more water in the morning, User misses sleep goals on Thursdays.'
            },
            category: {
              type: 'STRING',
              description: 'Category: hydration, sleep, habits, nutrition, general.'
            }
          },
          required: ['note']
        }
      }
    ]
  }
];

// Implementation of the tools executing updates on SQLite
const toolImplementations = {
  logWater: async ({ amount }) => {
    const today = getTodayDate();
    await dbUtils.run("INSERT INTO hydration_logs (date, amount) VALUES (?, ?)", [today, amount]);
    return { success: true, message: `Successfully logged ${amount}ml of water.` };
  },
  logSleep: async ({ duration, quality = 3 }) => {
    const today = getTodayDate();
    await dbUtils.run("INSERT INTO sleep_logs (date, duration, quality) VALUES (?, ?, ?)", [today, duration, quality]);
    return { success: true, message: `Successfully logged ${duration} hours of sleep with quality rating of ${quality}/5.` };
  },
  createHabit: async ({ name, icon = 'check' }) => {
    await dbUtils.run("INSERT INTO habits (name, icon, frequency) VALUES (?, ?, 'daily')", [name, icon]);
    return { success: true, message: `Successfully created habit "${name}".` };
  },
  completeHabit: async ({ habitName }) => {
    const today = getTodayDate();
    // Find matching habit
    const habits = await dbUtils.all("SELECT * FROM habits WHERE name LIKE ? AND active = 1", [`%${habitName}%`]);
    if (habits.length === 0) {
      return { success: false, message: `No active habit found matching "${habitName}".` };
    }
    const habit = habits[0];
    // Check if already completed today
    const log = await dbUtils.get("SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?", [habit.id, today]);
    if (log) {
      return { success: true, message: `Habit "${habit.name}" was already marked completed for today.` };
    }
    await dbUtils.run("INSERT INTO habit_logs (habit_id, date, completed) VALUES (?, ?, 1)", [habit.id, today]);
    return { success: true, message: `Successfully marked habit "${habit.name}" as completed.` };
  },
  saveHealthMemory: async ({ note, category = 'general' }) => {
    await dbUtils.run("INSERT INTO health_memory (note, category) VALUES (?, ?)", [note, category]);
    return { success: true, message: `Successfully saved observation to long-term memory: "${note}"` };
  }
};

// System Prompt for Aurora Health Coach
const SYSTEM_INSTRUCTIONS = `
You are Aurora, a warm, supportive, and intelligent personal health companion and coach.
Your design is modern, calm, and positive. You want to help the user understand their sleep, hydration, habits, and nutrition patterns.
Do not sound clinical, clinical descriptions are stressful. Instead, sound encouraging, empathetic, and conversational.
Keep your responses relatively brief (2-4 sentences max) so they are easy to read and listen to when spoken aloud by Text-to-Speech.

You have access to tools that let you update the user's health logs:
- logWater(amount): use when the user says they drank water/hydration.
- logSleep(duration, quality): use when the user mentions their sleep.
- createHabit(name, icon): use when the user wants to start tracking a new habit.
- completeHabit(habitName): use when the user reports completing a routine or habit (e.g. stretching, reading).
- saveHealthMemory(note, category): use to record insights, preferences, or recurring patterns (e.g. "prefers drinking water before bed", "sleeps less on Wednesdays").

Current date: ${getTodayDate()}.
Always execute tools as soon as you identify a user request to log or create something.
After calling a tool, explain what you did in a friendly way and suggest a positive follow-up.
`;

// AI agent processing chat request (text/audio)
async function processAgentChat(userText, audioBase64 = null, audioMime = null) {
  // If API key is missing, run in Mock fallback mode (keyword parser)
  if (!genAI) {
    return runMockAgent(userText);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // Gemini 1.5 flash has native audio processing and tool calling
      systemInstruction: SYSTEM_INSTRUCTIONS,
      tools: tools
    });

    let promptContents = [];
    if (audioBase64 && audioMime) {
      promptContents.push({
        inlineData: {
          data: audioBase64,
          mimeType: audioMime
        }
      });
      promptContents.push(`The user sent a voice message. Listen and respond. If they mention logging water, sleep, habits, or saving a memory, call the appropriate function tool. User text transcription if available: "${userText || ''}"`);
    } else {
      promptContents.push(userText);
    }

    // Call Gemini
    const result = await model.generateContent(promptContents);
    const response = result.response;

    // Check if Gemini wants to call a tool
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const { name, args } = call;
      console.log(`Gemini agent calling tool "${name}" with args:`, args);

      let toolResult;
      if (toolImplementations[name]) {
        try {
          toolResult = await toolImplementations[name](args);
        } catch (e) {
          console.error(`Error executing tool "${name}":`, e);
          toolResult = { success: false, message: `Tool execution failed: ${e.message}` };
        }
      } else {
        toolResult = { success: false, message: `Tool "${name}" is not implemented.` };
      }

      // Feed the function execution result back to the model to generate the final verbal response
      const chatSession = model.startChat({
        history: [
          {
            role: 'user',
            parts: promptContents
          },
          {
            role: 'model',
            parts: [{ functionCall: call }]
          },
          {
            role: 'user',
            parts: [{
              functionResponse: {
                name: name,
                response: toolResult
              }
            }]
          }
        ]
      });

      const finalResult = await chatSession.sendMessage("Acknowledge this action completion to the user in a short, friendly response.");
      return {
        text: finalResult.response.text(),
        actionTaken: name,
        actionDetails: args,
        success: toolResult.success
      };
    }

    return {
      text: response.text(),
      actionTaken: null,
      actionDetails: null,
      success: true
    };

  } catch (error) {
    console.error("Gemini agent error, falling back to mock:", error);
    return runMockAgent(userText);
  }
}

// AI macro estimator helper
async function estimateNutrition(mealDescription) {
  const defaultEstimate = {
    calories: 350,
    protein: 15,
    carbs: 45,
    fat: 10,
    explanation: "Standard meal estimate (fallback)."
  };

  if (!genAI) {
    return defaultEstimate;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert nutritionist. Estimate the macronutrient content of the following meal description.
      Meal: "${mealDescription}"

      Provide the estimate strictly as a JSON object with these fields:
      - calories (integer)
      - protein (number, grams)
      - carbs (number, grams)
      - fat (number, grams)
      - explanation (string, brief summary of how you estimated it)

      Example output:
      {
        "calories": 420,
        "protein": 24,
        "carbs": 38,
        "fat": 16,
        "explanation": "Estimated for a turkey sandwich with white bread and cheese."
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (e) {
    console.error("Error estimating nutrition with Gemini:", e);
    return defaultEstimate;
  }
}

// Fallback keyword agent if no API key or in case of errors
async function runMockAgent(userText) {
  if (!userText) {
    return {
      text: "Hello, I am Aurora. I'm here to support your health journey. Speak to me or type a message, and I will help you track water, sleep, habits, or nutrition!",
      actionTaken: null,
      actionDetails: null,
      success: true
    };
  }

  const text = userText.toLowerCase();

  // 1. Water tracking
  if (text.includes('water') || text.includes('drink') || text.includes('drank') || text.includes('hydration')) {
    let amount = 250; // default
    const numMatch = text.match(/(\d+)\s*(ml|milliliters|ounces|oz)/);
    if (numMatch) {
      amount = parseInt(numMatch[1]);
      if (text.includes('oz') || text.includes('ounce')) {
        amount = Math.round(amount * 29.57); // convert oz to ml
      }
    } else {
      const numbers = text.match(/\d+/);
      if (numbers) {
        amount = parseInt(numbers[0]);
        if (amount < 20) amount = amount * 250; // assume glasses
      }
    }

    await toolImplementations.logWater({ amount });
    return {
      text: `Hydration logged! I've added ${amount}ml of water to your daily progress. Keep going, you're doing great!`,
      actionTaken: 'logWater',
      actionDetails: { amount },
      success: true
    };
  }

  // 2. Sleep tracking
  if (text.includes('sleep') || text.includes('slept') || text.includes('bed')) {
    let duration = 8; // default
    const numMatch = text.match(/(\d+(\.\d+)?)\s*(hour|hr)/);
    if (numMatch) {
      duration = parseFloat(numMatch[1]);
    } else {
      const numbers = text.match(/\d+/);
      if (numbers) {
        duration = parseFloat(numbers[0]);
      }
    }

    let quality = 3;
    if (text.includes('great') || text.includes('good') || text.includes('well')) quality = 4;
    if (text.includes('amazing') || text.includes('excellent')) quality = 5;
    if (text.includes('bad') || text.includes('tired') || text.includes('poor')) quality = 2;

    await toolImplementations.logSleep({ duration, quality });
    return {
      text: `Sleep log updated. I've recorded ${duration} hours of sleep for you. Let's make sure you get enough rest tonight!`,
      actionTaken: 'logSleep',
      actionDetails: { duration, quality },
      success: true
    };
  }

  // 3. Habit tracking completion
  if (text.includes('complete') || text.includes('done') || text.includes('finished') || text.includes('checked')) {
    let habitName = 'Meditation';
    if (text.includes('stretch') || text.includes('stretch_logs')) habitName = 'Morning Stretch';
    else if (text.includes('read') || text.includes('book')) habitName = 'Read a Book';
    else if (text.includes('meditate') || text.includes('meditation')) habitName = 'Meditation';
    else if (text.includes('water')) habitName = 'Drink Water';

    const res = await toolImplementations.completeHabit({ habitName });
    if (res.success) {
      return {
        text: `Awesome! I've marked your "${habitName}" habit as completed for today. Consistency builds strong routines!`,
        actionTaken: 'completeHabit',
        actionDetails: { habitName },
        success: true
      };
    }
  }

  // 4. Habit tracking creation
  if (text.includes('create') || text.includes('track a new habit') || text.includes('add a habit') || text.includes('start a habit')) {
    let habitName = 'Exercise';
    const habitMatch = text.match(/(?:habit|track|add)\s+(?:called|named|to)?\s*([a-zA-Z\s]+)(?:every|daily|weekly|$)/i);
    if (habitMatch && habitMatch[1]) {
      habitName = habitMatch[1].trim();
    }

    await toolImplementations.createHabit({ name: habitName, icon: 'smile' });
    return {
      text: `Done! I've created a new habit to track: "${habitName}". It is now active on your dashboard.`,
      actionTaken: 'createHabit',
      actionDetails: { name: habitName },
      success: true
    };
  }

  // General response
  return {
    text: "I understand! I'm tracking that. Try logging your hydration ('I drank 500ml water'), your sleep ('I slept 8 hours'), or creating routines.",
    actionTaken: null,
    actionDetails: null,
    success: true
  };
}

module.exports = {
  processAgentChat,
  estimateNutrition
};
