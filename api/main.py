import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import model
import random
from typing import List
from pydantic import BaseModel


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Specify the correct domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextList(BaseModel):
    texts: List[str]

customWords = []

# Add new words to the censor list
@app.get("/add-custom-word/{word}")
def add_custom_word(word: str):

    if word in customWords:
        return {"message": "Word already in the list", "word": word}
    else:
        customWords.append(word)
        return{"Added word":word}

# Delete words from censor list
@app.get("/delete-custom-word/{word}")
def delete_custom_word(word: str):
        if word in customWords:
             customWords.remove(word)
             return {"Custom word": "Word removed from the list", "word": word}
        else:
             return {"Custom word": "Not found", "word": word}


# Check the list of custom words
@app.get('/custom-words')
def custom_words():
    return {"customWords": customWords}

@app.get("/")
def read_root():
    return {"Hello":"World"}

@app.get('/model')
def get_model():
    modelprint = model.model
    return {modelprint}
    
@app.post('/check-toxicity-fake/')
async def checkFakeToxicity(data: TextList):
    processed_texts = [random.randint(0,1) for _ in data.texts]  # fake processing
    return {"text_toxicity": processed_texts}

@app.post('/check-toxicity-list/')
async def checkToxicityList(data: TextList):
    processed_texts = model.predictToxicityList(data.texts)
    print(processed_texts)
    return {"text_toxicity": processed_texts.tolist()}


@app.get('/check-toxicity/{text}')
def checkToxicity(text):
    result = model.predictToxicity(text)
    return f'{text} is: {result}'


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)