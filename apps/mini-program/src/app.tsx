import { MiniProgramRootProvider } from "@/modules/runtime/mini-program-root-provider"
import "./app.css"

function App(props) {
  return <MiniProgramRootProvider>{props.children}</MiniProgramRootProvider>
}

export default App
