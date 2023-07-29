const express=require("express")
const apiRouter=express.Router()
const {Configuration, OpenAIApi}=require("openai")
const readline=require("readline")
const {QuestionModel}=require("../model/questions.model")
const natural = require('natural');
const {setCurrentQuestionId, getCurrentQuestionId}=require("../middlewares/questionID")

const openai=new OpenAIApi(new Configuration({
    apiKey:process.env.API_Key
}))

apiRouter.post("/chat/new",(req,res)=>{
    let question=req.body.question || 'How to use chatgpt?'
    openai.createCompletion({
        model: "text-davinci-003",
        prompt: `${question}`,
        max_tokens: 4000,
        temperature: 0,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }).then(response=>{
        return response?.data?.choices?.[0].text;
      }).then((ans)=>{
        const arr=ans?.split("\n").filter(ele=>ele).map(value=>value.trim());
        return arr;
      })
      .then(response=>{
        res.json({
            answer:response,
            prompt:question
        })        
    })
})



// Function to generate a response using the model
async function generateResponse(prompt, userAnswer) {
    const messages = [
        { role: "user", content: prompt + "Provide short answer"},
        { role: "assistant", content: userAnswer }
    ];

    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
    });

    return response.data.choices[0].message.content.trim();
}


function scoreAnswer(userAnswer, expectedAnswer) {
    if (!userAnswer) {
        return 0; // Or any other value you choose for no response
    }

    // Split the answers into arrays of words
    const userWords = userAnswer.toLowerCase().split(/\s+/);
    const expectedWords = expectedAnswer.toLowerCase().split(/\s+/);

    // Calculate the number of common words
    const commonWords = userWords.filter(word => expectedWords.includes(word));
    console.log(commonWords)

    // Calculate similarity score as a percentage
    const percentageSimilarity = (commonWords.length / expectedWords.length) * 100;
    console.log(percentageSimilarity)

    // Customize the scoring ranges and feedback based on your requirements
    let score;
    let feedback;
    if (percentageSimilarity >= 90) {
        score = 10;
        feedback = "Great job! Your answer is almost identical.";
    } else if (percentageSimilarity >= 70) {
        score = 7;
        feedback = "Good effort! Your answer is quite similar.";
    } else if (percentageSimilarity >= 50) {
        score = 5;
        feedback = "Your answer is partially correct.";
    } else {
        score = 3;
        feedback = "Your answer is quite different from the expected one.";
    }

    return { score, feedback };
}


 
apiRouter.get("/get/Question",async(req,res)=>{
    const randomNum = Math.floor(Math.random() * 10) + 1;
    try {
        const interviewQuestion = await QuestionModel.findOne({id:randomNum});
        setCurrentQuestionId(interviewQuestion.id)
        // console.log(getCurrentQuestionId())
        res.status(200).json({question:interviewQuestion.Question})
    } catch (error) {
       res.status(400).send(error) 
    }
})

apiRouter.post("/trial", async (req, res) => {
    const userAnswer = req.body.userAnswer; // Access the user's answer from the query parameter
    const questionId=getCurrentQuestionId()
    try {
         const interviewQuestion = await QuestionModel.findOne({id:questionId});
         console.log(interviewQuestion.Question)

        // You should get the user's answer from your front-end or wherever it is provided by the user.

        const response = await generateResponse(interviewQuestion.Question, userAnswer);
        // console.log(response)
        // Score the user's answer
        const score = scoreAnswer(userAnswer, response);

        res.status(200).json({
            Question: interviewQuestion.Question,
            UserAnswer: userAnswer,
            RequiredAns: response,
            Score: score.score,
            Feedback: score.feedback,
        });
    } catch (error) {
        res.status(500).json({ error: error});
    }
});
module.exports={apiRouter}