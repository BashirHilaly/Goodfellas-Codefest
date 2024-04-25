import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder
import os
import numpy as np
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from tensorflow.keras.layers import Embedding, LSTM, Bidirectional, Dense

model_path = "../model/toxicity_model_v1.h5"
dataset_path = "../dataset/toxicity_en.csv"

# Download necessary NLTK resources
nltk.download('stopwords')
nltk.download('wordnet')

# Define the text cleaning function
def clean_text(text):
  # Convert text to lowercase
  text = text.lower()

  # Replace URLs with <URL>
  text = re.sub(r'https?:\/\/\S+|www\.\S+', '<URL>', text)

  # Replace user handles with <USER>
  text = re.sub(r'@\w+', '<USER>', text)

  # Replace emojis with words
  text = re.sub(r'[8:=;][\'`\-]?[)d]+|[)d]+[\'`\-]?[8:=;]', '<SMILE>', text)
  text = re.sub(r'[8:=;][\'`\-]?p+', '<LOLFACE>', text)
  text = re.sub(r'[8:=;][\'`\-]?\(+|\)+[\'`\-]?[8:=;]', '<SADFACE>', text)
  text = re.sub(r'[8:=;][\'`\-]?[/|l*]', '<NEUTRALFACE>', text)
  text = re.sub(r'<3', '<HEART>', text)

  # Replace all numbers with <NUMBER>
  text = re.sub(r'[-+]?[.\d]*[\d]+[:,.\d]*', '<NUMBER>', text)

  # Replace hashtags with <HASHTAG> <Actual hashtag without hash>
  text = re.sub(r'#\S+', lambda match: '<HASHTAG> ' + match.group(0)[1:], text)

  # Replace punctuation repetitions (e.g. "!!!?" => "! <REPEAT>")
  text = re.sub(r'([!?.]){2,}', r'\1 <REPEAT>', text)

  # Replace elongated words (e.g., "noooo" => "no <ELONG>")
  text = re.sub(r'\b(\S*?)(.)\2{2,}\b', r'\1\2 <ELONG>', text)

  # Normalize whitespace
  text = re.sub(r'\s+', ' ', text).strip()

  # Remove non-alphanumeric characters (optional, could remove important <tokens>)
  # text = re.sub(r'[^a-z0-9\s<>\']', '', text)

  # Remove stopwords and apply lemmatization
  stop_words = set(stopwords.words('english'))
  lemmatizer = WordNetLemmatizer()
  text = ' '.join([lemmatizer.lemmatize(word) for word in text.split() if word not in stop_words])

  return text

df = pd.read_csv(dataset_path)

label_encoder = LabelEncoder()
df['is_toxic'] = label_encoder.fit_transform(df['is_toxic'])

# Apply clean_text to the text column
df['text'] = df['text'].apply(clean_text)

def load_glove_embeddings(path):
    embeddings_index = {}
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            values = line.split()
            word = values[0]
            coefs = np.asarray(values[1:], dtype='float32')
            embeddings_index[word] = coefs
    return embeddings_index

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

if not os.path.exists(model_path):
  # Path to the GloVe file
  glove_path = './glove.twitter.27B.100d.txt'
  embeddings_index = load_glove_embeddings(glove_path)
  embedding_dim = 100  # GloVe vectors are 100-dimensional for glove.twitter.27B.100d
  # Assuming `tokenizer` is already fitted to your corpus
  embedding_matrix = np.zeros((len(tokenizer.word_index) + 1, embedding_dim))
  for word, i in tokenizer.word_index.items():
      embedding_vector = embeddings_index.get(word)
      if embedding_vector is not None:
          embedding_matrix[i] = embedding_vector  # words not found in the embedding index will be all zeros.

  print("Model doesnt exist. Training one now...")
  # Define and compile your model
  model = tf.keras.Sequential([
      Embedding(input_dim=len(tokenizer.word_index) + 1, output_dim=embedding_dim,
              weights=[embedding_matrix], input_length=maxlen, trainable=False),
      Bidirectional(LSTM(64)),
      Dense(64, activation='relu'),
      Dense(1, activation='sigmoid')
  ])

  model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

  # Train your model
  model.fit(X_train, y_train, epochs=10, validation_data=(X_test, y_test))

  loss, accuracy = model.evaluate(X_test, y_test)

  print("Loss: ", loss)
  print("Accuracy: ", accuracy)

  # Save the model
  model.save(model_path)
else:
  model = tf.keras.models.load_model(model_path)


def preprocess_text(text):
  cleaned_text = clean_text(text)
  # Tokenize and pad the input text
  sequence = tokenizer.texts_to_sequences([cleaned_text])
  padded_sequence = pad_sequences(sequence, maxlen=maxlen, padding='post')
  return padded_sequence

def predictToxicity(text):
  processedText = preprocess_text(text)
  prediction = model.predict(processedText)
  toxicity_probability = prediction[0][0]
  print(toxicity_probability)
  if toxicity_probability > 0.5:
    print("Toxic")
    return 1
  else:
    print("Not Toxic")
    return 0
  

def preprocess_textList(textList):
  cleaned_textList = [clean_text(text) for text in textList]
  # Tokenize and pad the input text
  sequence = tokenizer.texts_to_sequences(cleaned_textList)
  padded_sequences = pad_sequences(sequence, maxlen=maxlen, padding='post')
  return padded_sequences
  
def predictToxicityList(textList):
  processedTextList = preprocess_textList(textList)
  predictions = model.predict(processedTextList)
  
  # Convert probabilities to binary outcomes based on the threshold (> 0.5)
  # predictions[:, 0] assumes the model returns a probability array where each row corresponds to a text
  toxicity_binary = np.where(predictions[:, 0] > 0.5, 1, 0)
  return toxicity_binary


# predictToxicity('That girl is bitch')