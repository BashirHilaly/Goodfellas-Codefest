import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder
import os
import json

import numpy as np

df = pd.read_csv("D:/Coding/Goodfellas-Codefest/dataset/toxicity_en.csv")

label_encoder = LabelEncoder()
df['is_toxic'] = label_encoder.fit_transform(df['is_toxic'])

train_df, test_df = train_test_split(df, test_size=0.1, random_state=42)

print('Length of train set: ', len(train_df))
print('Length of test set: ', len(test_df))

tokenizer = Tokenizer()
tokenizer.fit_on_texts(train_df['text'])

# Convert text data to sequences
X_train = tokenizer.texts_to_sequences(train_df['text'])
X_test = tokenizer.texts_to_sequences(test_df['text'])

# Find max length = 196
# Pad sequences to ensure uniform length
maxlen = 196  # Example length, adjust as needed
X_train = pad_sequences(X_train, maxlen=maxlen, padding='post')
X_test = pad_sequences(X_test, maxlen=maxlen, padding='post')

# Prepare labels
y_train = train_df['is_toxic']
y_test = test_df['is_toxic']

# Load the configuration for different model path computers
def load_config():
    with open('D:/Coding/Goodfellas-Codefest/api/config.json', 'r') as f:
        config = json.load(f)
    return config

config = load_config()
model_path = config['model_path']

if not os.path.exists(model_path):
  print("Model doesnt exist. Training one now...")
  # Define and compile your model
  model = tf.keras.Sequential([
      tf.keras.layers.Embedding(input_dim=len(tokenizer.word_index)+1, output_dim=64, input_length=maxlen),
      tf.keras.layers.Flatten(),
      tf.keras.layers.Dense(64, activation='relu'),
      tf.keras.layers.Dense(1, activation='sigmoid')
  ])

  model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

  # Train your model
  model.fit(X_train, y_train, epochs=20, batch_size=32, validation_data=(X_test, y_test))

  loss, accuracy = model.evaluate(X_test, y_test)

  print("Loss: ", loss)
  print("Accuracy: ", accuracy)

  # Save the model
  model.save('D:/Coding/Goodfellas-Codefest/model/toxicity_model_v1.h5')
else:
  model = tf.keras.models.load_model('D:/Coding/Goodfellas-Codefest/model/toxicity_model_v1.h5')


def preprocess_text(text):
    # Tokenize and pad the input text
    sequence = tokenizer.texts_to_sequences([text])
    padded_sequence = pad_sequences(sequence, maxlen=maxlen, padding='post')
    return padded_sequence

def predictToxicity(text):
  processedText = preprocess_text(text)
  prediction = model.predict(processedText)
  toxicity_probability = prediction[0][0]
  print(toxicity_probability)
  if toxicity_probability > 0.5:
    print("Toxic")
    return 'Toxic'
  else:
    print("Not Toxic")
    return 'Not Toxic'


# predictToxicity('That girl is bitch')