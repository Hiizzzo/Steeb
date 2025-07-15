
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StatsNew from "./pages/StatsNew";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/estadisticas" element={<StatsNew />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
