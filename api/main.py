from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello":"World"}

customWords = []
@app.get("/add-custom-word/{word}")
def add_custom_word(word: str):

    if word in customWords:
        return {"message": "Word already in the list", "word": word}

    else:
        customWords.append(word)
        return{"Added word":word}

@app.get('/custom-words')
def custom_words():
    return {"customWords": customWords}