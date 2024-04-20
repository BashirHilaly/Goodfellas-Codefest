import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import json

MAX_LEN = 196

# Load the configuration for different model path computers
def load_config():
    with open('config.json', 'r') as f:
        config = json.load(f)
    return config

config = load_config()
model_path = config['model_path']
model = tf.keras.models.load_model(model_path)

tokenizer = Tokenizer()

def preprocess_text(text):
    # Tokenize and pad the input text
    sequence = tokenizer.texts_to_sequences([text])
    padded_sequence = pad_sequences(sequence, maxlen=MAX_LEN, padding='post')
    print(padded_sequence)
    return padded_sequence

def predictToxicity(text):
  processedText = preprocess_text(text)
  prediction = model.predict(processedText)
  toxicity_probability = prediction[0][0]
  if toxicity_probability > 0.5:
    print("Toxic")
    return 'Toxic'
  else:
    print("Not Toxic")
    return 'Toxic'
