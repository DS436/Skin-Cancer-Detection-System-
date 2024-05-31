import { config } from "dotenv";
import { OpenAI } from "openai";
import readline from "readline";

// Load environment variables
config();

// Initialize OpenAI API with your API key
const openAi = new OpenAI({
    apiKey: process.env.API_KEY,
});

// Create readline interface for user input
const userInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Display the prompt to the user
userInterface.prompt();

// Listen for user input
userInterface.on("line", async input => {
    // Send the user input to OpenAI for completion
    const chatCompletion = await openAi.chat.completions.create({
        model: "gpt-4-0613", // Change the model to a supported one
        messages: [{ "role": "user", "content": input }],
    });

    // Log the response from OpenAI
    console.log(chatCompletion.choices[0].message.content);

    // Display the prompt to the user again
    userInterface.prompt();
});