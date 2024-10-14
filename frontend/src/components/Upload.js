import React, { useState } from "react";
import axios from "axios";
import { Button, TextField, Typography, Card, CardContent } from '@mui/material';

function Upload() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState(""); // State for extracted text
  const [sentiment, setSentiment] = useState(""); // State for sentiment result

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]); // Store the selected image
  };

  const extractText = async () => {
    try {
      const formData = new FormData();
      formData.append("image", image); // Send image as multipart/form-data

      const response = await axios.post("http://localhost:5000/ocr", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Extracted Text:", response.data.text);
      setText(response.data.text); // Store the extracted text
    } catch (error) {
      console.error("Error extracting text:", error);
    }
  };

  const analyzeSentiment = async () => {
    try {
      console.log("Text to analyze:", text); // Log the text to verify
  
      if (!isValidSentimentInput(text)) {
        console.error("Invalid input for sentiment analysis:", text);
        setSentiment("Invalid input for sentiment analysis");
        return;
      }
  
      const response = await axios.post("http://localhost:5000/analyze", {
        text,
      });
  
      console.log("Response data:", response.data); // Log the response data
  
      // Check if the response contains sentiment data
      if (response.data && Array.isArray(response.data[0])) {
        const sentiments = response.data[0]; // Array of sentiment objects
        const topSentiment = sentiments.reduce((max, s) =>
          s.score > max.score ? s : max
        ); // Find the sentiment with the highest score
  
        setSentiment(`${topSentiment.label} (${topSentiment.score.toFixed(2)})`);
        const mood = topSentiment.label === 'POSITIVE' ? 'happy' : 'sad'; 
        recommendMusic(mood);
      } else {
        setSentiment("No valid sentiment data found.");
      }
    } catch (error) {
      console.error("Error analyzing sentiment:", error.message);
      setSentiment("An error occurred during sentiment analysis.");
    }
  };
  
  // Helper function for input validation
  const isValidSentimentInput = (input) => {
    return input && input.trim().length > 0; // Example validation logic
  };

  const recommendMusic = async (mood) => {
    try {
      console.log(mood);
      const { data } = await axios.get(`http://localhost:5000/recommend/${mood}`);
      alert(`Recommended Song: ${data.name} by ${data.artist}\nLink: ${data.url}`);
    } catch (error) {
      console.error('Error fetching recommendation:', error);
    }
  };
  

  return (
    <Card style={{ maxWidth: 600, margin: '20px auto', padding: '20px' }}>
      <CardContent>
        <Typography variant="h4" gutterBottom>AI-Powered Music Recommender</Typography>

        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginBottom: '10px' }} />
        <Button variant="contained" color="primary" onClick={extractText} style={{ marginRight: '10px' }}>
          Extract Text
        </Button>
        <Button variant="contained" color="secondary" onClick={analyzeSentiment}>
          Analyze Sentiment
        </Button>

        {text && (
          <div style={{ marginTop: '20px' }}>
            <Typography variant="h6">Extracted Text:</Typography>
            <Typography variant="body1">{text}</Typography>
          </div>
        )}

        {sentiment && (
          <div style={{ marginTop: '20px' }}>
            <Typography variant="h6">Sentiment:</Typography>
            <Typography variant="body1">{sentiment}</Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default Upload;
