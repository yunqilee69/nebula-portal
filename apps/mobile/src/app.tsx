import { MiniProgramRootProvider } from "@/modules/runtime/mini-program-root-provider"
import "./app.css"
import type { ReactNode } from "react"

interface AppProps {
  children?: ReactNode
}

function App(props: AppProps) {
  return <MiniProgramRootProvider>{props.children}</MiniProgramRootProvider>
}

export default App
