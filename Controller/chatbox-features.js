
// chatbox-features.js
let model;
console.log('chatbox-features.js loaded');

async function loadModel() {
  try {
    const modelUrl = 'https://json-host.s3.us-east-2.amazonaws.com/model.json';
    model = await tf.loadLayersModel(modelUrl);
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Error loading model:', error);
  }
}

class SkinDiagnosisSystem {
  constructor() {
    this.certainties = {};
    this.responses = [];
    document.getElementById('message-input').addEventListener('keypress', this.handleKeyPress.bind(this));
    this.currentQuestion = null;
    this.resolveCurrentQuestion = null;
    loadModel();
  }

  handleKeyPress(event) {
      if (event.key === 'Enter') {
        const inputField = document.getElementById('message-input');
        const userResponse = inputField.value.trim();
        displayMessage(userResponse, ''); // Display user message in chat
        inputField.value = ''; // Clear input field
  
        if (this.currentQuestion && this.resolveCurrentQuestion) {
          this.resolveCurrentQuestion(userResponse);
        }
      }
    }
  }

window.onload = function() {
    loadModel();
    document.getElementById('message-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Display welcome message
    displayMessageWithImage("Welcome to the skin cancer detection system. Would you like to answer questions, upload photos, or both to receive a diagnosis? To get started with the questions, type in 'diagnose'. For an image diagnosis, simply upload or capture an image.", '');
}


function displayMessageWithImage(message, imageUrl) {
  var chatMessages = document.getElementById('chat-messages');
  var messageContainer = document.createElement('div');
  messageContainer.classList.add('message-container');

  // Display text message
  if (message !== '') {
      var textMessage = document.createElement('div');
      textMessage.textContent = message;
      textMessage.classList.add('text-message');
      messageContainer.appendChild(textMessage);
  }

  // Display image if available
  if (imageUrl) {
      var img = document.createElement('img');
      img.src = imageUrl;
      img.classList.add('message-image');

      // Set styles for images to appear on the left and twice in size
      img.style.marginRight = '8px'; // Adjust the margin as needed
      img.style.maxWidth = '400px'; // Twice the original size
      img.style.maxHeight = '400px'; // Twice the original size

      messageContainer.appendChild(img);
  }

  chatMessages.appendChild(messageContainer);

  // Scroll to the bottom of the chat messages
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
  var messageInput = document.getElementById('message-input');
  var message = messageInput.value.trim();

  if (message !== '') {
      // Display the actual message
      displayMessageWithImage(message, '');

      // Run diagnosis if message is 'diagnose' or 'gpt questions'
      if (message.toLowerCase() === 'diagnose') {
          runDiagnosis();
      } else if (message.toLowerCase() === 'gpt questions') {
          // Call the function to initiate gpt questions
          initialize(); 
      }

      // Clear input
      messageInput.value = '';

      // Scroll to the bottom of the chat messages
      var chatMessages = document.getElementById('chat-messages');
      chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}



async function initialize() {
  try {
      const API_KEY = ''; 
      const API_URL = `https://api.openai.com/v1/chat/completions`;

      displayMessageWithImage("GPT diagnosis mode activated. Please ask a question.", '');

      document.getElementById('message-input').addEventListener('keypress', async function (event) {
          if (event.key === 'Enter') {
              const messageInput = document.getElementById('message-input');
              const userQuestion = messageInput.value.trim();
              messageInput.value = '';

              const postData = {
                  model: "gpt-3.5-turbo", // Adjust as per actual available model
                  max_tokens: 500,
                  messages: [{
                      role: "user",
                      content: userQuestion
                  }]
              };

              const response = await fetch(API_URL, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${API_KEY}`
                  },
                  body: JSON.stringify(postData)
              });

              if (response.ok) {
                  const data = await response.json();
                  if (data.choices && data.choices.length > 0) {
                      const gptResponse = data.choices[0].text;
                      displayMessageWithImage(gptResponse, '');
                  } else {
                      console.error('No completion found:', data);
                      displayMessageWithImage("Failed to get a response from GPT.", '');
                  }
              } else {
                  console.error('HTTP Error:', response.status);
                  const errorData = await response.json();  // Ensure this is only here if not already read
                  displayMessageWithImage(`Error from GPT: ${errorData.message}`, '');
              }
          }
      });
  } catch (error) {
      console.log('Error initializing:', error);
      displayMessageWithImage("Error while initializing GPT session.", '');
  }
}



let updatedResult;
async function runDiagnosis() {
    // Define the questions and default certainties
    let questions = [
        ["Are you often exposed to the sun or tanning beds?", 0.8],
        ["Is there a family history of skin disease or cancer?", 0.7],
        ["Have you had any past skin conditions?", 0.5],
        ["Do you have any other medical conditions?", 0.4],
        // Add more questions here 
    ];

    // Mapping responses to the certainty scale
    const certainty_mapping = {
        "definitely not": -1.0,
        "almost certainly not": -0.8,
        "probably not": -0.6,
        "maybe not": -0.4,
        "unknown": 0.0,
        "maybe": 0.4,
        "probably": 0.6,
        "almost certainly": 0.8,
        "definitely": 1.0
    };

    let certainties = {};
    let responses = [];

    // Ask questions and collect responses
    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        try {
            const response = await askQuestion(question[0], question[1], certainty_mapping);
            certainties[question[0]] = response;
            responses.push(response); // Update the responses array
        } catch (error) {
            console.error(error);
            return; // Exit the function if there's an error
        }
    }

    // Evaluate certainties and calculate the results
    const result = calculateAverageCertainty(certainties);
    displayMessageWithImage("\nOverall Certainty for a skin cancer/disease:", '');
    displayMessageWithImage(result.toString(), '');
    const result2 = calculateAverageResponse(responses);
    displayMessageWithImage("\nOverall certainty of a skin condition based off responses:", '');
    displayMessageWithImage(result2.toString(), '');
    displayMessageWithImage("\n", '');

    if (result2 < -0.3) {
        displayMessageWithImage("Based on your responses, we are certain you have no skin cancer/disease.", '');
    } else if (result2 > 0.3) {
        displayMessageWithImage("Based on your responses, we have more questions to ask\n", '');
        // Ask additional questions
        let extraQuestions = [
            // Seborrheic
            ["\nHave you noticed any raised or waxy growths on your skin?", 1.0],
            ["Are the growths brown, black, or flesh-colored?", 0.8],
            ["How many of these growths have you observed on your skin?", 0.9],
            ["Are the growths predominantly on sun-exposed areas or covered areas of the skin?", 0.7],
            ["Do the lesions cause any itching or discomfort?", 0.8],
             // Nevus
             ["Do you have any raised or flat spots on your skin that are darker than the surrounding skin?", 0.9],
             ["Have you noticed any new spots appearing on your skin recently?", 0.8],
             ["Do your moles have irregular borders or uneven edges?", 0.7],
             ["Have you observed any changes in the size or color of existing moles?", 0.8],
             ["Do you have any moles larger than 6mm in diameter?", 0.7],

             // Melanoma
             ["Do you have a new or changing mole?", 0.9],
             ["Do you have a mole that is bleeding, itching, or crusting?", 0.8],
             ["Do you have a mole with multiple colors?", 0.9],
             ["Do you have a mole with an irregular border?", 0.8],
             ["Has the lesion changed in size, shape, or color over time?", 0.8],
             // Add more questions here
        ];

        let messagePrefix = ["Certainty for Seborrheic cancer", "Certainty for Nevus", "Certainty for Melanoma"];
        let messageIndex = 0;

        for (let i = 0; i < extraQuestions.length; i++) {
            const question = extraQuestions[i];
            try {
                const response = await askQuestion(question[0], question[1], certainty_mapping);
                certainties[question[0]] = response;
                responses.push(response); // Update the responses array

                // Calculate and display average certainty after every set of 5 questions
                if ((i + 1) % 5 === 0) {
                    const averageCertainty = calculateAverageCertainty(certainties);
                    displayMessageWithImage(`${messagePrefix[messageIndex]}: ${averageCertainty}`, '');
                    messageIndex++;
                }
            } catch (error) {
                console.error(error);
                return; // Exit the function if there's an error
            }
        }

        // Recalculate overall certainties
        updatedResult = calculateAverageCertainty(certainties);
        displayMessageWithImage("\nUpdated Overall Certainty for a skin cancer/disease:", '');
        displayMessageWithImage(updatedResult.toString(), '');
        displayMessageWithImage("\nYou can upload the image for better diagnosis.", '');
        const updatedResult2 = calculateAverageResponse(responses);
        //displayMessageWithImage("\nUpdated Overall certainty of a skin condition based off responses:", '');
        //displayMessageWithImage(updatedResult2.toString(), '');
    } else {
        displayMessageWithImage("We are unsure what is wrong. Consider uploading an image.", '');
    }
}





function askQuestion(question, default_certainty, certainty_mapping) {
    return new Promise((resolve, reject) => {
        const chatMessages = document.getElementById('chat-messages');

        // Display the question in the chatbox
        displayMessageWithImage(question, '');

        // Create and append a submit button
        const submitButton = createSubmitButton();
        chatMessages.appendChild(submitButton);

        // Add click event listener to the submit button
        submitButton.addEventListener('click', () => {
            const userInput = chatMessages.lastChild.textContent.trim().toLowerCase(); // Get user's input
            if (userInput in certainty_mapping) {
                const user_certainty = certainty_mapping[userInput] * default_certainty;
                resolve(user_certainty); // Resolve the promise with user's certainty
                // Remove the submit button after use
                chatMessages.removeChild(submitButton);
            } else {
                displayMessageWithImage("Invalid response. Please choose from: definitely not, almost certainly not, probably not, maybe not, unknown, maybe, probably, almost certainly, definitely", '');
                // Remove the previous submit button
                chatMessages.removeChild(submitButton);
                // Ask the same question again
                askQuestion(question, default_certainty, certainty_mapping).then(resolve); // Attach the event listener to the new submit button
            }
        });
    });
}




// Function to create a submit button
function createSubmitButton() {
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Confirm Response';

    // Apply custom styling to the submit button
    submitButton.style.padding = '1px 2px';
    submitButton.style.fontSize = '15px';
    submitButton.style.width = '150px';
    submitButton.style.height = '45px';
    submitButton.style.position = 'absolute';
    submitButton.style.right = '350px';

    return submitButton;
}






function calculateAverageCertainty(certainties) {
    const total_certainty = Object.values(certainties).reduce((acc, curr) => acc + curr, 0);
    const num_questions = Object.keys(certainties).length;
    return num_questions > 0 ? total_certainty / num_questions : 0.0;
}

function calculateAverageResponse(responses) {
    const total_response = responses.reduce((acc, curr) => acc + curr, 0);
    const average_response = responses.length > 0 ? total_response / responses.length : 0.0;

    // Adjust the result based on specified conditions
    if (average_response == 0.6) {
        return average_response + .4; // Add 4 if the average response is greater than 0.6
    } else if (average_response >= 0.01 && average_response <= 0.59) {
        return average_response + .2; // Add 2 if the average response is between 0 and 0.6
    } else if (average_response == -0.6) {
        return average_response - .4; // Subtract 4 if the average response is less than -0.6
    } else if (average_response <= -0.01 && average_response >= -0.59) {
        return average_response - .2; // Subtract 2 if the average response is between -0.6 and 0
    } else {
        return average_response; // Return the original average response if conditions are not met
    }
}



























function uploadImage() {
  if (!window.FileReader) {
    console.error('FileReader API not supported');
    return;
  }

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      console.warn('No file selected');
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      const imageDataUrl = event.target.result;
      displayMessageWithImage('', imageDataUrl);

      // Create a temporary image element to pass to predictImage
      const tempImage = new Image();
      tempImage.onload = async () => {
        const predictionText = await predictImage(tempImage);
        console.log("Prediction text:", predictionText);
        displayMessageWithImage(predictionText, ''); // Use displayMessageWithImage instead of displayMessage
    };
      // Set the src attribute of tempImage after it has been defined
      tempImage.src = imageDataUrl;
    };

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  });

  fileInput.click();
}

async function predictImage(imageElement) {
  // Check if the image element is valid
  if (!imageElement || !imageElement.naturalWidth || !imageElement.naturalHeight) {
       console.error("Invalid image element.");
       return null;
  } else {
// Replace the line that resizes the image to [299, 299]
    const imageTensor = tf.browser.fromPixels(imageElement)
    .toFloat() // Convert to float32 for model input
    .resizeNearestNeighbor([224, 224]); // Resize to match the model input size
 
       // Normalize the pixel values to be between 0 and 1
       const normalizedImageTensor = imageTensor.div(tf.scalar(255));
 
       // Add a batch dimension to the tensor
       const batchedImageTensor = normalizedImageTensor.expandDims(0);
 
       // Make a prediction using the model
       const prediction = await model.predict(batchedImageTensor);
       console.log(prediction.shape); // Log the shape of the prediction tensor
       console.log(prediction.dataSync());
       
       // Assuming the model's output is a 2D array where the first dimension is the batch size
       // and the second dimension contains the probabilities for each class.
       const probabilities = prediction.dataSync();
       const score = probabilities[0]; // Assuming the model outputs a single probability
 
       // Define the threshold for malignancy
       const threshold = 0.75;

       // avg 
       const avg = (score+updatedResult)/2;
 

       // Calculate the certainty of malignancy or benignness
       let certaintyText;
       if (avg >= threshold) {
           certaintyText = `This is your updated analysis. Malignant: ${Math.round(avg)}`;
       } else {
           certaintyText = `This is your updated analysis. Benign: ${(1 - avg)}`;
       }
 
       // Clean up the tensor to free up memory
       normalizedImageTensor.dispose();
       imageTensor.dispose();
       batchedImageTensor.dispose();
 
       return certaintyText;
  }
 }

function printConversation() {
  // Print the conversation as a PDF
  window.print();
}




function clearChat() {
  var chatMessages = document.getElementById('chat-messages');
  var clearDuster = document.getElementById('clear-duster');

  // Add the 'clear-animation' class to initiate the duster animation
  clearDuster.style.height = '100%';
  clearDuster.style.transition = 'height  0.5s ease-out';

  // After a brief delay, remove the 'clear-animation' style, clear the chat
  setTimeout(function () {
      chatMessages.innerHTML = '';
      clearDuster.style.height = '0';
  },  500); // Adjust the time based on your animation duration
}




async function captureImage() {
  try {
      // Request access to the webcam
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // Create a video element to display the webcam stream
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for the video to be loaded fully
      await new Promise(resolve => {
          video.onloadedmetadata = resolve;
      });

      // Create a canvas to draw the video frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stop the video stream
      stream.getTracks().forEach(track => track.stop());

      // Add the captured image to the chatbox
      const imageDataUrl = canvas.toDataURL();
      displayMessageWithImage('', imageDataUrl);

      // Create a temporary image element to pass to predictImage
      const tempImage = new Image();
      tempImage.onload = async () => {
          // Call predictImage with the temporary image element
          const predictionText = await predictImage(tempImage);
          console.log("Prediction text:", predictionText);
          displayMessageWithImage(predictionText, ''); // Display the prediction text in the chatbox
      };
      // Set the src attribute of tempImage after it has been defined
      tempImage.src = imageDataUrl;
  } catch (error) {
      console.error('Error capturing image:', error);
  }
} 
