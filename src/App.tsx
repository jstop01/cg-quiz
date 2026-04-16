import { useQuizState } from "./hooks/useQuizState";
import StartScreen from "./components/StartScreen";
import QuizScreen from "./components/QuizScreen";
import ResultScreen from "./components/ResultScreen";

function App() {
  const { state, dispatch, hasProgress } = useQuizState();

  if (state.screen === "start")
    return (
      <StartScreen dispatch={dispatch} hasProgress={hasProgress} />
    );
  if (state.screen === "quiz")
    return <QuizScreen state={state} dispatch={dispatch} />;
  if (state.screen === "result")
    return <ResultScreen state={state} dispatch={dispatch} />;

  return null;
}

export default App;
