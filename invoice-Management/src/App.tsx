import { BrowserRouter, useRoutes } from "react-router-dom";
import routes from "./router";
import TitleUpdater from "./components/TitleUpdater";

function RoutesWrapper() {
  

  return useRoutes(routes);
}

export default function App() {
  return (
    
    <BrowserRouter>
      <TitleUpdater /> 
      <RoutesWrapper />
    </BrowserRouter>
  );
}
