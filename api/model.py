import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

model = tf.keras.models.load_model('D:/Coding/Goodfellas-Codefest/dataset/toxicity_en.csv')

tokenizer = Tokenizer()

def preprocess_text(text):
    # Tokenize and pad the input text
    sequence = tokenizer.texts_to_sequences([text])
    padded_sequence = pad_sequences(sequence, maxlen=maxlen, padding='post')
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
