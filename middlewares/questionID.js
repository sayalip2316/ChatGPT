let currentQuestionId = null;

function setCurrentQuestionId(questionId) {
  currentQuestionId = questionId;
}

function getCurrentQuestionId() {
  return currentQuestionId;
}

module.exports = {
  setCurrentQuestionId,
  getCurrentQuestionId,
};