import uvicorn
from fastapi import FastAPI
import model


app = FastAPI()

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
    
@app.get('/check-toxicity/{text}')
def checkToxicity(text):
    result = model.predictToxicity(text)
    return result


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)