import uvicorn
from fastapi import FastAPI
import model


app = FastAPI()

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